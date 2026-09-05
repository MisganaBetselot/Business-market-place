from django.conf import settings
from django.db import models


class Favorite(models.Model):
    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
    )

    listing = models.ForeignKey(
        "listings.BusinessListing",
        on_delete=models.CASCADE,
        related_name="favorites",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "listing"],
                name="unique_user_listing_favorite",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.listing.business_name}"