from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from notifications.models import Notification

from .models import Media
from .serializers import MediaSerializer


class MediaListCreateView(generics.ListCreateAPIView):
    serializer_class = MediaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Media.objects.filter(
            listing__seller=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save()


class MediaAdminListView(generics.ListAPIView):
    serializer_class = MediaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_admin:
            return Media.objects.none()

        return Media.objects.all().order_by("-created_at")


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
            ).get(pk=pk)
        except Media.DoesNotExist:
            return Response(
                {"detail": "Media not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if media.status != Media.Status.PENDING_REVIEW:
            return Response(
                {"detail": "This media has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        media.status = Media.Status.APPROVED
        media.reviewed_by = request.user
        media.reviewed_at = now
        media.rejection_reason = None
        media.save()
        AuditLog.objects.create(
    admin=request.user,
    action="MEDIA_APPROVED",
    target_type="Media",
    target_id=str(media.id),
    notes=f"Media for {media.listing.business_name} approved.",
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
                "media": MediaSerializer(media).data,
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
            ).get(pk=pk)
        except Media.DoesNotExist:
            return Response(
                {"detail": "Media not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if media.status != Media.Status.PENDING_REVIEW:
            return Response(
                {"detail": "This media has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("rejection_reason")

        if not reason:
            return Response(
                {"detail": "rejection_reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        media.status = Media.Status.REJECTED
        media.reviewed_by = request.user
        media.reviewed_at = timezone.now()
        media.rejection_reason = reason
        media.save()

        AuditLog.objects.create(
    admin=request.user,
    action="MEDIA_REJECTED",
    target_type="Media",
    target_id=str(media.id),
    notes=(
        f"Media for {media.listing.business_name} rejected. "
        f"Reason: {reason}"
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
                "media": MediaSerializer(media).data,
            },
            status=status.HTTP_200_OK,
        )