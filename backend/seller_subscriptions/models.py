from django.conf import settings
from django.db import models


class SellerSubscription(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACTIVE = "ACTIVE", "Active"
        EXPIRED = "EXPIRED", "Expired"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )

    plan = models.ForeignKey(
        "subscriptions.SubscriptionPlan",
        on_delete=models.PROTECT,
        related_name="seller_subscriptions",
    )

    business = models.ForeignKey(
    "listings.BusinessListing",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="seller_subscription",
)

    start_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    expiry_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"