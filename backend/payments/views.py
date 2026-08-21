from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PaymentReceipt
from .serializers import PaymentReceiptSerializer


class PaymentReceiptListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentReceipt.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PaymentReceiptAdminListView(generics.ListAPIView):
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_admin:
            return PaymentReceipt.objects.none()

        return PaymentReceipt.objects.all().order_by("-created_at")


class PaymentReceiptApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            receipt = PaymentReceipt.objects.select_related(
                "subscription__plan"
            ).get(pk=pk)
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

        now = timezone.now()

        receipt.status = PaymentReceipt.Status.APPROVED
        receipt.reviewed_by = request.user
        receipt.reviewed_at = now
        receipt.rejection_reason = None
        receipt.save()

        subscription = receipt.subscription
        subscription.status = "ACTIVE"
        subscription.start_date = now
        subscription.expiry_date = now + timezone.timedelta(
            days=subscription.plan.duration_days
        )
        subscription.save()

        return Response(
            {
                "message": "Payment receipt approved successfully.",
                "receipt": PaymentReceiptSerializer(receipt).data,
                "subscription_status": subscription.status,
                "subscription_start_date": subscription.start_date,
                "subscription_expiry_date": subscription.expiry_date,
            },
            status=status.HTTP_200_OK,
        )


class PaymentReceiptRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            receipt = PaymentReceipt.objects.get(pk=pk)
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

        reason = request.data.get("rejection_reason")

        if not reason:
            return Response(
                {"detail": "rejection_reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        receipt.status = PaymentReceipt.Status.REJECTED
        receipt.reviewed_by = request.user
        receipt.reviewed_at = timezone.now()
        receipt.rejection_reason = reason
        receipt.save()

        subscription = receipt.subscription
        subscription.status = "REJECTED"
        subscription.save()

        return Response(
            {
                "message": "Payment receipt rejected.",
                "receipt": PaymentReceiptSerializer(receipt).data,
                "subscription_status": subscription.status,
            },
            status=status.HTTP_200_OK,
        )