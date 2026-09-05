from django.conf import settings
from django.db import models


class Media(models.Model):
    class MediaType(models.TextChoices):
        PHOTO = "PHOTO", "Photo"
        VIDEO = "VIDEO", "Video"

    class Status(models.TextChoices):
        PENDING_REVIEW = "PENDING_REVIEW", "Pending Review"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        DEACTIVATED = "DEACTIVATED", "Deactivated"

    id = models.BigAutoField(primary_key=True)

    listing = models.ForeignKey(
        "listings.BusinessListing",
        on_delete=models.CASCADE,
        related_name="media",
    )

    subscription = models.ForeignKey(
        "seller_subscriptions.SellerSubscription",
        on_delete=models.PROTECT,
        related_name="media",
    )

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
    )

    file_path = models.FileField(
        upload_to="business_media/",
        null=True,
        blank=True,
    )

    external_url = models.URLField(
        null=True,
        blank=True,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_REVIEW,
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_media",
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    rejection_reason = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.media_type} - {self.listing.business_name}"