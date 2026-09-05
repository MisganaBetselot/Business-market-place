from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class AdvertisementPlan(models.Model):
    class AdType(models.TextChoices):
        DEDICATED = "DEDICATED", "Dedicated Banner"
        SHARED = "SHARED", "Shared Banner"

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100)
    ad_type = models.CharField(
        max_length=20,
        choices=AdType.choices,
    )
    duration_days = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(31),
        ]
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    slide_duration_seconds = models.PositiveIntegerField(
        default=5,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(60),
        ]
    )
    max_slots = models.PositiveIntegerField(
        default=1,
        validators=[
            MinValueValidator(1),
        ]
    )
    description = models.TextField(
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Advertisement(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "PENDING_PAYMENT", "Pending Payment"
        PENDING_REVIEW = "PENDING_REVIEW", "Pending Review"
        ACTIVE = "ACTIVE", "Active"
        REJECTED = "REJECTED", "Rejected"
        EXPIRED = "EXPIRED", "Expired"
        SUSPENDED = "SUSPENDED", "Suspended"

    id = models.BigAutoField(primary_key=True)

    advertiser = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="advertisements",
)

    plan = models.ForeignKey(
    AdvertisementPlan,
    on_delete=models.PROTECT,
    related_name="advertisements",
)

    title = models.CharField(max_length=255)
    description = models.TextField(
        null=True,
        blank=True,
    )
    image_url = models.URLField()
    target_url = models.URLField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_PAYMENT,
    )

    start_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    end_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    priority = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class AdvertisementPayment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.BigAutoField(primary_key=True)

    advertiser = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="advertisement_payments",
    )

    advertisement = models.ForeignKey(
        Advertisement,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    receipt_file = models.FileField(
        upload_to="advertisement_receipts/",
    )

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
        related_name="reviewed_advertisement_payments",
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
        return f"Advertisement payment #{self.id}"