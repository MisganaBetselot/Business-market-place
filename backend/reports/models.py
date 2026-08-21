from django.conf import settings
from django.db import models


class Report(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        REVIEWED = "REVIEWED", "Reviewed"
        DISMISSED = "DISMISSED", "Dismissed"
        ACTION_TAKEN = "ACTION_TAKEN", "Action Taken"

    id = models.BigAutoField(primary_key=True)

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports",
    )

    listing = models.ForeignKey(
        "listings.BusinessListing",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reports",
    )

    media = models.ForeignKey(
        "media.Media",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reports",
    )

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_reports",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Report #{self.id}"