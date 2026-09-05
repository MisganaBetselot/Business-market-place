from django.db import transaction
from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from users.permissions import IsAdminUser

from audit_logs.models import AuditLog
from notifications.models import Notification

from .models import PaymentReceipt
from .serializers import PaymentReceiptSerializer


class PaymentReceiptListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            PaymentReceipt.objects
            .filter(user=self.request.user)
            .select_related(
                "subscription",
                "subscription__plan",
                "subscription__business",
            )
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        user = self.request.user
        subscription = serializer.validated_data["subscription"]

        if subscription.user_id != user.id:
            raise serializers.ValidationError(
                {
                    "subscription": (
                        "You can only submit a receipt for your own "
                        "subscription."
                    )
                }
            )

        if subscription.status != subscription.Status.PENDING:
            raise serializers.ValidationError(
                {
                    "subscription": (
                        "A payment receipt can only be submitted for "
                        "a PENDING subscription."
                    )
                }
            )

        existing_receipt = PaymentReceipt.objects.filter(
            subscription=subscription,
            status=PaymentReceipt.Status.PENDING,
        ).exists()

        if existing_receipt:
            raise serializers.ValidationError(
                {
                    "subscription": (
                        "A payment receipt is already pending for "
                        "this subscription."
                    )
                }
            )

        serializer.save(user=user)


class PaymentReceiptAdminListView(generics.ListAPIView):
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = (
            PaymentReceipt.objects
            .select_related(
                "user",
                "subscription",
                "subscription__plan",
                "subscription__business",
                "reviewed_by",
            )
            .order_by("-created_at")
        )

        receipt_status = self.request.query_params.get("status")

        if receipt_status:
            queryset = queryset.filter(
                status=receipt_status
            )

        return queryset


class PaymentReceiptApproveView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            # Lock only the payment receipt row.
            # Do not use select_related here because
            # subscription__business is nullable and PostgreSQL
            # does not allow FOR UPDATE on the nullable side of
            # an outer join.
            receipt = (
                PaymentReceipt.objects
                .select_for_update()
                .get(pk=pk)
            )
        except PaymentReceipt.DoesNotExist:
            return Response(
                {"detail": "Payment receipt not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if receipt.status != PaymentReceipt.Status.PENDING:
            return Response(
                {"detail": "This receipt has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Retrieve the subscription separately.
        subscription = receipt.subscription

        if subscription.user_id != receipt.user_id:
            return Response(
                {
                    "detail": (
                        "The receipt user does not match the "
                        "subscription owner."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Lock the subscription separately as well.
        subscription = (
    type(subscription).objects
    .select_for_update()
    .select_related("plan")
    .get(pk=subscription.pk)
)

        if subscription.status != subscription.Status.PENDING:
            return Response(
                {
                    "detail": (
                        "Only a PENDING subscription can be activated."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        receipt.status = PaymentReceipt.Status.APPROVED
        receipt.reviewed_by = request.user
        receipt.reviewed_at = now
        receipt.rejection_reason = None

        receipt.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
            ]
        )

        subscription.status = subscription.Status.ACTIVE
        subscription.start_date = now
        subscription.expiry_date = now + timezone.timedelta(
            days=subscription.plan.duration_days
        )

        subscription.save(
            update_fields=[
                "status",
                "start_date",
                "expiry_date",
                "updated_at",
            ]
        )

        AuditLog.objects.create(
            admin=request.user,
            action="PAYMENT_RECEIPT_APPROVED",
            target_type="PaymentReceipt",
            target_id=str(receipt.id),
            notes=(
                f"Payment receipt approved. "
                f"Subscription #{subscription.id} activated."
            ),
        )

        Notification.objects.create(
            user=receipt.user,
            type=Notification.NotificationType.RECEIPT_APPROVED,
            message=(
                f"Your payment receipt #{receipt.id} has been approved. "
                f"Your {subscription.plan.name} subscription is now active."
            ),
        )

        # Reload the receipt with all related data for the response.
        receipt = (
            PaymentReceipt.objects
            .select_related(
                "user",
                "subscription",
                "subscription__plan",
                "subscription__business",
                "reviewed_by",
            )
            .get(pk=receipt.pk)
        )

        return Response(
            {
                "message": "Payment receipt approved successfully.",
                "receipt": PaymentReceiptSerializer(
                    receipt,
                    context={"request": request},
                ).data,
                "subscription_status": subscription.status,
                "subscription_start_date": subscription.start_date,
                "subscription_expiry_date": subscription.expiry_date,
            },
            status=status.HTTP_200_OK,
        )


class PaymentReceiptRejectView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            # Lock only the receipt itself.
            receipt = (
                PaymentReceipt.objects
                .select_for_update()
                .get(pk=pk)
            )
        except PaymentReceipt.DoesNotExist:
            return Response(
                {"detail": "Payment receipt not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if receipt.status != PaymentReceipt.Status.PENDING:
            return Response(
                {"detail": "This receipt has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = str(
            request.data.get("rejection_reason", "")
        ).strip()

        if not reason:
            return Response(
                {"detail": "rejection_reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Lock the subscription separately.
        subscription = receipt.subscription

        subscription = (
            type(subscription).objects
            .select_for_update()
            .get(pk=subscription.pk)
        )

        receipt.status = PaymentReceipt.Status.REJECTED
        receipt.reviewed_by = request.user
        receipt.reviewed_at = timezone.now()
        receipt.rejection_reason = reason

        receipt.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
            ]
        )

        if subscription.status == subscription.Status.PENDING:
            subscription.status = subscription.Status.REJECTED
            subscription.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

        AuditLog.objects.create(
            admin=request.user,
            action="PAYMENT_RECEIPT_REJECTED",
            target_type="PaymentReceipt",
            target_id=str(receipt.id),
            notes=(
                f"Payment receipt rejected. "
                f"Reason: {reason}"
            ),
        )

        Notification.objects.create(
            user=receipt.user,
            type=Notification.NotificationType.RECEIPT_REJECTED,
            message=(
                f"Your payment receipt #{receipt.id} was rejected. "
                f"Reason: {reason}"
            ),
        )

        # Reload for serializer response.
        receipt = (
            PaymentReceipt.objects
            .select_related(
                "user",
                "subscription",
                "subscription__plan",
                "subscription__business",
                "reviewed_by",
            )
            .get(pk=receipt.pk)
        )

        return Response(
            {
                "message": "Payment receipt rejected.",
                "receipt": PaymentReceiptSerializer(
                    receipt,
                    context={"request": request},
                ).data,
                "subscription_status": subscription.status,
            },
            status=status.HTTP_200_OK,
        )