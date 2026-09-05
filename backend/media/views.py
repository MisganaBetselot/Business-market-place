from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from users.permissions import IsAdminUser

from audit_logs.models import AuditLog
from notifications.models import Notification

from .models import Media
from .serializers import MediaSerializer


class MediaListCreateView(generics.ListCreateAPIView):
    serializer_class = MediaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Media.objects
            .filter(listing__seller=self.request.user)
            .select_related(
                "listing",
                "listing__category",
                "subscription",
                "subscription__plan",
                "reviewed_by",
            )
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save()


class MediaAdminListView(generics.ListAPIView):
    serializer_class = MediaSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = (
            Media.objects
            .select_related(
                "listing",
                "listing__category",
                "listing__seller",
                "subscription",
                "subscription__plan",
                "reviewed_by",
            )
            .order_by("-created_at")
        )

        media_status = self.request.query_params.get("status")

        if media_status:
            queryset = queryset.filter(status=media_status)

        return queryset


class MediaStartReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            media = Media.objects.select_related(
                "listing",
                "listing__seller",
                "subscription",
            ).get(pk=pk)
        except Media.DoesNotExist:
            return Response(
                {"detail": "Media not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if media.status != Media.Status.PENDING_REVIEW:
            return Response(
                {
                    "detail": (
                        "Only media pending review can be moved "
                        "to under review."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        media.status = Media.Status.UNDER_REVIEW
        media.save(update_fields=["status"])

        return Response(
            {
                "message": "Media is now under review.",
                "media": MediaSerializer(
                    media,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class MediaApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            media = Media.objects.select_related(
                "listing",
                "listing__seller",
                "subscription",
            ).get(pk=pk)
        except Media.DoesNotExist:
            return Response(
                {"detail": "Media not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if media.status not in [
            Media.Status.PENDING_REVIEW,
            Media.Status.UNDER_REVIEW,
        ]:
            return Response(
                {
                    "detail": (
                        "Only pending or under-review media "
                        "can be approved."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if media.subscription.status != media.subscription.Status.ACTIVE:
            return Response(
                {
                    "detail": (
                        "Media cannot be approved because its "
                        "subscription is not active."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            media.subscription.expiry_date is not None
            and media.subscription.expiry_date <= timezone.now()
        ):
            return Response(
                {
                    "detail": (
                        "Media cannot be approved because its "
                        "subscription has expired."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        media.status = Media.Status.APPROVED
        media.reviewed_by = request.user
        media.reviewed_at = now
        media.rejection_reason = None

        media.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
            ]
        )

        AuditLog.objects.create(
            admin=request.user,
            action="MEDIA_APPROVED",
            target_type="Media",
            target_id=str(media.id),
            notes=(
                f"Media for {media.listing.business_name} "
                "approved."
            ),
        )

        Notification.objects.create(
            user=media.listing.seller,
            type=Notification.NotificationType.MEDIA_APPROVED,
            message=(
                f"Your media for {media.listing.business_name} "
                "has been approved."
            ),
        )

        return Response(
            {
                "message": "Media approved successfully.",
                "media": MediaSerializer(
                    media,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class MediaRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            media = Media.objects.select_related(
                "listing",
                "listing__seller",
                "subscription",
            ).get(pk=pk)
        except Media.DoesNotExist:
            return Response(
                {"detail": "Media not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if media.status not in [
            Media.Status.PENDING_REVIEW,
            Media.Status.UNDER_REVIEW,
        ]:
            return Response(
                {
                    "detail": (
                        "Only pending or under-review media "
                        "can be rejected."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("rejection_reason")

        if not reason:
            return Response(
                {"detail": "rejection_reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = str(reason).strip()

        if not reason:
            return Response(
                {"detail": "rejection_reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        media.status = Media.Status.REJECTED
        media.reviewed_by = request.user
        media.reviewed_at = timezone.now()
        media.rejection_reason = reason

        media.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
            ]
        )

        AuditLog.objects.create(
            admin=request.user,
            action="MEDIA_REJECTED",
            target_type="Media",
            target_id=str(media.id),
            notes=(
                f"Media for {media.listing.business_name} "
                f"rejected. Reason: {reason}"
            ),
        )

        Notification.objects.create(
            user=media.listing.seller,
            type=Notification.NotificationType.MEDIA_REJECTED,
            message=(
                f"Your media for {media.listing.business_name} "
                f"has been rejected. Reason: {reason}"
            ),
        )

        return Response(
            {
                "message": "Media rejected.",
                "media": MediaSerializer(
                    media,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )