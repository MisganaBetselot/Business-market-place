from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class SubscriptionPlan(models.Model):
    id = models.BigAutoField(primary_key=True)

    name = models.CharField(
        max_length=100
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

    photo_limit = models.PositiveIntegerField(
        default=5,
        validators=[
            MinValueValidator(1),
        ]
    )

    video_link_allowed = models.BooleanField(
        default=True
    )

    description = models.TextField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return self.name