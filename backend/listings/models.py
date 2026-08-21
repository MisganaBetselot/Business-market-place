from django.conf import settings
from django.db import models


class BusinessListing(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        SOLD = "SOLD", "Sold"
        SUSPENDED = "SUSPENDED", "Suspended"

    id = models.BigAutoField(primary_key=True)

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_listings",
    )

    category = models.ForeignKey(
        "categories.BusinessCategory",
        on_delete=models.PROTECT,
        related_name="business_listings",
    )

    business_name = models.CharField(max_length=255)
    description = models.TextField()
    asking_price = models.DecimalField(max_digits=15, decimal_places=2)

    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    area = models.CharField(max_length=100, null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    phone = models.CharField(max_length=20, null=True, blank=True)
    whatsapp = models.CharField(max_length=20, null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name