from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from notifications.models import Notification

from .models import Report
from .serializers import ReportSerializer


class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Report.objects
            .filter(reporter=self.request.user)
            .select_related(
                "listing",
                "media",
                "reviewed_by",
            )
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(
            reporter=self.request.user,
            status=Report.Status.PENDING,
        )


class ReportAdminListView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_admin:
            return Report.objects.none()

        return (
            Report.objects
            .select_related(
                "reporter",
                "listing",
                "media",
                "reviewed_by",
            )
            .order_by("-created_at")
        )


class ReportReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            report = Report.objects.select_related(
                "reporter",
                "listing",
                "media",
            ).get(pk=pk)
        except Report.DoesNotExist:
            return Response(
                {"detail": "Report not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if report.status != Report.Status.PENDING:
            return Response(
                {"detail": "This report has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review_status = request.data.get("status")

        allowed_statuses = [
            Report.Status.REVIEWED,
            Report.Status.DISMISSED,
            Report.Status.ACTION_TAKEN,
        ]

        if review_status not in allowed_statuses:
            return Response(
                {
                    "detail": (
                        "status must be REVIEWED, DISMISSED, "
                        "or ACTION_TAKEN."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        report.status = review_status
        report.reviewed_by = request.user
        report.reviewed_at = timezone.now()

        report.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
            ]
        )
        AuditLog.objects.create(
    admin=request.user,
    action="REPORT_REVIEWED",
    target_type="Report",
    target_id=str(report.id),
    notes=f"Report status changed to {review_status}.",
)

        if review_status == Report.Status.DISMISSED:
            message = (
                f"Your report #{report.id} has been "
                "reviewed and dismissed."
            )

        elif review_status == Report.Status.ACTION_TAKEN:
            message = (
                f"Action has been taken regarding "
                f"your report #{report.id}."
            )

        else:
            message = (
                f"Your report #{report.id} has been reviewed."
            )

        Notification.objects.create(
            user=report.reporter,
            type=Notification.NotificationType.REPORT_REVIEWED,
            message=message,
        )

        return Response(
            {
                "message": "Report reviewed successfully.",
                "report": ReportSerializer(report).data,
            },
            status=status.HTTP_200_OK,
        )