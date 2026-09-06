from django.db import models


class SubscriptionPlan(models.Model):
    class MediaType(models.TextChoices):
        PHOTO = "PHOTO", "Photo"
        VIDEO = "VIDEO", "Video"

    id = models.BigAutoField(primary_key=True)

    name = models.CharField(max_length=100)

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
    )

    duration_days = models.PositiveIntegerField()

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    # Maximum number of photos allowed for this plan.
    # NULL means no photo limit / not applicable.
    media_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name