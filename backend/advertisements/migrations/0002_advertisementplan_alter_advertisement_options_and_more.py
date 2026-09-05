# Generated manually for safe advertisement schema migration.

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def migrate_existing_advertisements(apps, schema_editor):
    Advertisement = apps.get_model("advertisements", "Advertisement")
    AdvertisementPlan = apps.get_model("advertisements", "AdvertisementPlan")

    # Create an inactive legacy plan for advertisements that existed
    # before the paid advertisement system was introduced.
    legacy_plan, _ = AdvertisementPlan.objects.get_or_create(
        name="Legacy Advertisement",
        defaults={
            "ad_type": "DEDICATED",
            "duration_days": 1,
            "price": 0,
            "slide_duration_seconds": 5,
            "max_slots": 1,
            "description": (
                "Legacy plan created during migration for advertisements "
                "that existed before the paid advertisement system."
            ),
            "is_active": False,
        },
    )

    for advertisement in Advertisement.objects.all():
        # Preserve the old created_by user as the new advertiser.
        if advertisement.created_by_id is None:
            raise RuntimeError(
                f"Advertisement #{advertisement.id} has no created_by user. "
                "Cannot safely migrate it to advertiser."
            )

        advertisement.advertiser_id = advertisement.created_by_id

        # Preserve the old advertisement as historical data.
        # Existing advertisements were not paid through the new system,
        # so they must not become active paid advertisements automatically.
        advertisement.status = "EXPIRED"

        advertisement.plan_id = legacy_plan.id

        advertisement.save(
            update_fields=[
                "advertiser",
                "status",
                "plan",
            ]
        )


class Migration(migrations.Migration):

    dependencies = [
        ("advertisements", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Create the new advertisement plan table.
        migrations.CreateModel(
            name="AdvertisementPlan",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "name",
                    models.CharField(max_length=100),
                ),
                (
                    "ad_type",
                    models.CharField(
                        choices=[
                            ("DEDICATED", "Dedicated Banner"),
                            ("SHARED", "Shared Banner"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "duration_days",
                    models.PositiveIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(31),
                        ]
                    ),
                ),
                (
                    "price",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                    ),
                ),
                (
                    "slide_duration_seconds",
                    models.PositiveIntegerField(
                        default=5,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(60),
                        ],
                    ),
                ),
                (
                    "max_slots",
                    models.PositiveIntegerField(
                        default=1,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                        ],
                    ),
                ),
                (
                    "description",
                    models.TextField(
                        blank=True,
                        null=True,
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(default=True),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True),
                ),
            ],
        ),

        # 2. Add the new fields temporarily as nullable.
        migrations.AddField(
            model_name="advertisement",
            name="advertiser",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="advertisements",
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        migrations.AddField(
            model_name="advertisement",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING_PAYMENT", "Pending Payment"),
                    ("PENDING_REVIEW", "Pending Review"),
                    ("ACTIVE", "Active"),
                    ("REJECTED", "Rejected"),
                    ("EXPIRED", "Expired"),
                    ("SUSPENDED", "Suspended"),
                ],
                default="PENDING_PAYMENT",
                max_length=20,
            ),
        ),

        # 3. Add plan temporarily as nullable.
        migrations.AddField(
            model_name="advertisement",
            name="plan",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="advertisements",
                to="advertisements.advertisementplan",
            ),
        ),

        # 4. Create the payment/receipt table.
        migrations.CreateModel(
            name="AdvertisementPayment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "receipt_file",
                    models.FileField(
                        upload_to="advertisement_receipts/",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("APPROVED", "Approved"),
                            ("REJECTED", "Rejected"),
                        ],
                        default="PENDING",
                        max_length=20,
                    ),
                ),
                (
                    "reviewed_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                    ),
                ),
                (
                    "rejection_reason",
                    models.TextField(
                        blank=True,
                        null=True,
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                    ),
                ),
                (
                    "advertisement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payments",
                        to="advertisements.advertisement",
                    ),
                ),
                (
                    "advertiser",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="advertisement_payments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_advertisement_payments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),

        # 5. Transfer old data before removing the old columns.
        migrations.RunPython(
            migrate_existing_advertisements,
            migrations.RunPython.noop,
        ),

        # 6. Now the old fields can safely be removed.
        migrations.RemoveField(
            model_name="advertisement",
            name="created_by",
        ),

        migrations.RemoveField(
            model_name="advertisement",
            name="is_active",
        ),

        # 7. Make the new fields required now that existing rows have values.
        migrations.AlterField(
            model_name="advertisement",
            name="advertiser",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="advertisements",
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        migrations.AlterField(
            model_name="advertisement",
            name="plan",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="advertisements",
                to="advertisements.advertisementplan",
            ),
        ),

        # 8. These were nullable in the old database but are required
        # by the new model. Existing advertisements already have URLs.
        migrations.AlterField(
            model_name="advertisement",
            name="image_url",
            field=models.URLField(),
        ),

        migrations.AlterField(
            model_name="advertisement",
            name="target_url",
            field=models.URLField(),
        ),

        migrations.AlterField(
            model_name="advertisement",
            name="priority",
            field=models.PositiveIntegerField(default=1),
        ),

        # 9. Restore the model's current Meta configuration.
        migrations.AlterModelOptions(
            name="advertisement",
            options={},
        ),
    ]