from django.conf import settings
from django.db import models


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        RECEIPT_APPROVED = "RECEIPT_APPROVED", "Receipt Approved"
        RECEIPT_REJECTED = "RECEIPT_REJECTED", "Receipt Rejected"
        MEDIA_APPROVED = "MEDIA_APPROVED", "Media Approved"
        MEDIA_REJECTED = "MEDIA_REJECTED", "Media Rejected"
        NEW_INQUIRY = "NEW_INQUIRY", "New Inquiry"
        SUBSCRIPTION_EXPIRING = (
            "SUBSCRIPTION_EXPIRING",
            "Subscription Expiring",
        )
        SUBSCRIPTION_EXPIRED = (
            "SUBSCRIPTION_EXPIRED",
            "Subscription Expired",
        )
        REPORT_REVIEWED = "REPORT_REVIEWED", "Report Reviewed"

    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
    )

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.type}"