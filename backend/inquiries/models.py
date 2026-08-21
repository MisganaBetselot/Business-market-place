from django.conf import settings
from django.db import models


class Inquiry(models.Model):
    id = models.BigAutoField(primary_key=True)

    listing = models.ForeignKey(
        "listings.BusinessListing",
        on_delete=models.CASCADE,
        related_name="inquiries",
    )

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_inquiries",
    )

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_inquiries",
    )

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Inquiry #{self.id} - {self.listing.business_name}"