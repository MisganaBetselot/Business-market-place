from datetime import timedelta

from django.db import models, transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from notifications.models import Notification
from users.permissions import IsAdminUser

from .models import (
    Advertisement,
    AdvertisementPayment,
    AdvertisementPlan,
)
from .serializers import (
    AdvertisementPaymentAdminSerializer,
    AdvertisementPaymentSerializer,
    AdvertisementPlanSerializer,
    AdvertisementSerializer,
    PublicAdvertisementPlanSerializer,
    PublicAdvertisementSerializer,
)


# ============================================================
# PUBLIC ADVERTISEMENT PLANS
# ============================================================

class PublicAdvertisementPlanListView(APIView):
    permission_classes = []

    def get(self, request):
        plans = (
            AdvertisementPlan.objects
            .filter(is_active=True)
            .order_by("price", "duration_days")
        )

        serializer = PublicAdvertisementPlanSerializer(
            plans,
            many=True,
        )

        return Response(serializer.data)


# ============================================================
# PUBLIC ACTIVE ADVERTISEMENTS
# ============================================================

class PublicAdvertisementListView(APIView):
    permission_classes = []

    def get(self, request):
        now = timezone.now()

        advertisements = (
            Advertisement.objects
            .filter(
                status=Advertisement.Status.ACTIVE,
                start_at__lte=now,
                end_at__gt=now,
            )
            .select_related("plan")
            .order_by("-priority", "-created_at")
        )

        serializer = PublicAdvertisementSerializer(
            advertisements,
            many=True,
        )

        return Response(serializer.data)


# ============================================================
# ADVERTISER'S OWN ADVERTISEMENTS
# ============================================================

class AdvertisementListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        advertisements = (
            Advertisement.objects
            .filter(advertiser=request.user)
            .select_related("plan")
            .order_by("-created_at")
        )

        serializer = AdvertisementSerializer(
            advertisements,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = AdvertisementSerializer(
            data=request.data,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan = serializer.validated_data["plan"]

        if not plan.is_active:
            return Response(
                {
                    "detail": (
                        "This advertisement plan is inactive."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        advertisement = serializer.save(
            advertiser=request.user,
            status=Advertisement.Status.PENDING_PAYMENT,
        )

        return Response(
            AdvertisementSerializer(advertisement).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ADVERTISEMENT PAYMENT RECEIPTS
# ============================================================

class AdvertisementPaymentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = (
            AdvertisementPayment.objects
            .filter(advertiser=request.user)
            .select_related(
                "advertisement",
                "advertiser",
                "advertisement__plan",
            )
            .order_by("-created_at")
        )

        serializer = AdvertisementPaymentSerializer(
            payments,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = AdvertisementPaymentSerializer(
            data=request.data,
            context={"request": request},
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = serializer.save(
            advertiser=request.user,
        )

        advertisement = payment.advertisement

        advertisement.status = Advertisement.Status.PENDING_REVIEW

        advertisement.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return Response(
            AdvertisementPaymentSerializer(
                payment,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ADMIN ADVERTISEMENT MANAGEMENT
# ============================================================

class AdvertisementAdminListCreateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        advertisements = (
            Advertisement.objects
            .select_related(
                "advertiser",
                "plan",
            )
            .order_by("-created_at")
        )

        serializer = AdvertisementSerializer(
            advertisements,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        """
        Admin-created advertisements still go through the
        normal payment/review workflow.

        The admin is creating the advertisement on behalf
        of the authenticated admin account, but approval
        is still required before activation.
        """

        serializer = AdvertisementSerializer(
            data=request.data,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan = serializer.validated_data["plan"]

        if not plan.is_active:
            return Response(
                {
                    "detail": (
                        "This advertisement plan is inactive."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        advertisement = serializer.save(
            advertiser=request.user,
            status=Advertisement.Status.PENDING_PAYMENT,
        )

        return Response(
            AdvertisementSerializer(advertisement).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ADMIN ADVERTISEMENT DETAIL
# ============================================================

class AdvertisementAdminDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return (
                Advertisement.objects
                .select_related(
                    "advertiser",
                    "plan",
                )
                .get(pk=pk)
            )
        except Advertisement.DoesNotExist:
            return None

    def get(self, request, pk):
        advertisement = self.get_object(pk)

        if advertisement is None:
            return Response(
                {
                    "detail": "Advertisement not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            AdvertisementSerializer(
                advertisement
            ).data
        )

    def put(self, request, pk):
        advertisement = self.get_object(pk)

        if advertisement is None:
            return Response(
                {
                    "detail": "Advertisement not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdvertisementSerializer(
            advertisement,
            data=request.data,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(serializer.data)

    def patch(self, request, pk):
        advertisement = self.get_object(pk)

        if advertisement is None:
            return Response(
                {
                    "detail": "Advertisement not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdvertisementSerializer(
            advertisement,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(serializer.data)

    def delete(self, request, pk):
        advertisement = self.get_object(pk)

        if advertisement is None:
            return Response(
                {
                    "detail": "Advertisement not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        advertisement.delete()

        return Response(
            {
                "message": (
                    "Advertisement deleted successfully."
                )
            },
            status=status.HTTP_204_NO_CONTENT,
        )


# ============================================================
# ADMIN ADVERTISEMENT PLANS
# ============================================================

class AdvertisementPlanAdminListCreateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        plans = (
            AdvertisementPlan.objects
            .all()
            .order_by(
                "price",
                "duration_days",
            )
        )

        serializer = AdvertisementPlanSerializer(
            plans,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = AdvertisementPlanSerializer(
            data=request.data,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan = serializer.save()

        return Response(
            AdvertisementPlanSerializer(plan).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ADMIN ADVERTISEMENT PLAN DETAIL
# ============================================================

class AdvertisementPlanAdminDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return AdvertisementPlan.objects.get(pk=pk)
        except AdvertisementPlan.DoesNotExist:
            return None

    def get(self, request, pk):
        plan = self.get_object(pk)

        if plan is None:
            return Response(
                {
                    "detail": (
                        "Advertisement plan not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            AdvertisementPlanSerializer(plan).data
        )

    def put(self, request, pk):
        plan = self.get_object(pk)

        if plan is None:
            return Response(
                {
                    "detail": (
                        "Advertisement plan not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdvertisementPlanSerializer(
            plan,
            data=request.data,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(serializer.data)

    def patch(self, request, pk):
        plan = self.get_object(pk)

        if plan is None:
            return Response(
                {
                    "detail": (
                        "Advertisement plan not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdvertisementPlanSerializer(
            plan,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(serializer.data)

    def delete(self, request, pk):
        plan = self.get_object(pk)

        if plan is None:
            return Response(
                {
                    "detail": (
                        "Advertisement plan not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if plan.advertisements.exists():
            return Response(
                {
                    "detail": (
                        "This plan is already used by "
                        "advertisements and cannot be deleted."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan.delete()

        return Response(
            {
                "message": (
                    "Advertisement plan deleted successfully."
                )
            },
            status=status.HTTP_204_NO_CONTENT,
        )


# ============================================================
# ADMIN ADVERTISEMENT PAYMENT LIST
# ============================================================

class AdvertisementPaymentAdminListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        payments = (
            AdvertisementPayment.objects
            .select_related(
                "advertisement",
                "advertisement__plan",
                "advertiser",
                "reviewed_by",
            )
            .order_by("-created_at")
        )

        payment_status = request.query_params.get("status")

        if payment_status:
            payments = payments.filter(
                status=payment_status
            )

        serializer = AdvertisementPaymentAdminSerializer(
            payments,
            many=True,
        )

        return Response(serializer.data)


# ============================================================
# ADMIN APPROVE ADVERTISEMENT PAYMENT
# ============================================================

class AdvertisementPaymentApproveView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request, pk):
        try:
            payment = (
                AdvertisementPayment.objects
                .select_for_update()
                .select_related(
                    "advertisement",
                    "advertisement__plan",
                    "advertiser",
                )
                .get(pk=pk)
            )
        except AdvertisementPayment.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Advertisement payment not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----------------------------------------------------
        # Verify payment state
        # ----------------------------------------------------

        if payment.status != AdvertisementPayment.Status.PENDING:
            return Response(
                {
                    "detail": (
                        "Only pending payments can be approved."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        advertisement = (
            Advertisement.objects
            .select_for_update()
            .select_related("plan")
            .get(pk=payment.advertisement_id)
        )

        # ----------------------------------------------------
        # Verify advertisement state
        # ----------------------------------------------------

        if advertisement.status != Advertisement.Status.PENDING_REVIEW:
            return Response(
                {
                    "detail": (
                        "This advertisement is not awaiting "
                        "payment review."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan = advertisement.plan

        # ----------------------------------------------------
        # Verify plan
        # ----------------------------------------------------

        if not plan.is_active:
            return Response(
                {
                    "detail": (
                        "The advertisement plan is inactive "
                        "and cannot be approved."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        # ----------------------------------------------------
        # Slot management
        #
        # Dedicated:
        # one company occupies one dedicated slot.
        #
        # Shared:
        # multiple companies can occupy the shared banner
        # according to the specific plan's max_slots.
        # ----------------------------------------------------

        active_ads = (
            Advertisement.objects
            .filter(
                plan=plan,
                status=Advertisement.Status.ACTIVE,
                start_at__lte=now,
                end_at__gt=now,
            )
            .count()
        )

        if active_ads >= plan.max_slots:
            if (
                plan.ad_type
                == AdvertisementPlan.AdType.DEDICATED
            ):
                return Response(
                    {
                        "detail": (
                            "There is no available dedicated "
                            "advertisement slot for this plan."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    "detail": (
                        "All shared advertisement slots for "
                        "this plan are currently occupied."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # Approve payment
        # ----------------------------------------------------

        payment.status = (
            AdvertisementPayment.Status.APPROVED
        )
        payment.reviewed_by = request.user
        payment.reviewed_at = now
        payment.rejection_reason = None

        payment.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
            ]
        )

        # ----------------------------------------------------
        # Activate advertisement
        # ----------------------------------------------------

        advertisement.status = Advertisement.Status.ACTIVE
        advertisement.start_at = now
        advertisement.end_at = (
            now + timedelta(days=plan.duration_days)
        )

        advertisement.save(
            update_fields=[
                "status",
                "start_at",
                "end_at",
                "updated_at",
            ]
        )

        # ----------------------------------------------------
        # Notify advertiser
        # ----------------------------------------------------

        Notification.objects.create(
            user=advertisement.advertiser,
            type=(
                Notification.NotificationType
                .ADVERTISEMENT_PAYMENT_APPROVED
            ),
            message=(
                f"Your advertisement "
                f"#{advertisement.id} has been approved "
                f"and is now active."
            ),
        )

        # ----------------------------------------------------
        # Audit log
        # ----------------------------------------------------

        AuditLog.objects.create(
            admin=request.user,
            action="ADVERTISEMENT_PAYMENT_APPROVED",
            target_type="AdvertisementPayment",
            target_id=str(payment.id),
            notes=(
                f"Advertisement #{advertisement.id} "
                f"was approved and activated."
            ),
        )

        return Response(
            {
                "message": (
                    "Advertisement payment approved."
                ),
                "advertisement": AdvertisementSerializer(
                    advertisement
                ).data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN REJECT ADVERTISEMENT PAYMENT
# ============================================================

class AdvertisementPaymentRejectView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request, pk):
        try:
            payment = (
                AdvertisementPayment.objects
                .select_for_update()
                .select_related(
                    "advertisement",
                    "advertiser",
                )
                .get(pk=pk)
            )
        except AdvertisementPayment.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Advertisement payment not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----------------------------------------------------
        # Verify payment state
        # ----------------------------------------------------

        if payment.status != AdvertisementPayment.Status.PENDING:
            return Response(
                {
                    "detail": (
                        "Only pending payments can be rejected."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # Validate rejection reason
        # ----------------------------------------------------

        rejection_reason = request.data.get(
            "rejection_reason"
        )

        if not rejection_reason:
            return Response(
                {
                    "rejection_reason": (
                        "A rejection reason is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        rejection_reason = str(
            rejection_reason
        ).strip()

        if not rejection_reason:
            return Response(
                {
                    "rejection_reason": (
                        "A rejection reason is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        # ----------------------------------------------------
        # Reject payment
        # ----------------------------------------------------

        payment.status = (
            AdvertisementPayment.Status.REJECTED
        )
        payment.reviewed_by = request.user
        payment.reviewed_at = now
        payment.rejection_reason = rejection_reason

        payment.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
            ]
        )

        # ----------------------------------------------------
        # Reject advertisement
        # ----------------------------------------------------

        advertisement = payment.advertisement

        advertisement.status = Advertisement.Status.REJECTED

        advertisement.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        # ----------------------------------------------------
        # Notify advertiser
        # ----------------------------------------------------

        Notification.objects.create(
            user=advertisement.advertiser,
            type=(
                Notification.NotificationType
                .ADVERTISEMENT_PAYMENT_REJECTED
            ),
            message=(
                f"Your advertisement "
                f"#{advertisement.id} payment was rejected. "
                f"Reason: {rejection_reason}"
            ),
        )

        # ----------------------------------------------------
        # Audit log
        # ----------------------------------------------------

        AuditLog.objects.create(
            admin=request.user,
            action="ADVERTISEMENT_PAYMENT_REJECTED",
            target_type="AdvertisementPayment",
            target_id=str(payment.id),
            notes=(
                f"Advertisement #{advertisement.id} "
                f"payment was rejected. "
                f"Reason: {rejection_reason}"
            ),
        )

        return Response(
            {
                "message": (
                    "Advertisement payment rejected."
                ),
                "rejection_reason": rejection_reason,
            },
            status=status.HTTP_200_OK,
        )