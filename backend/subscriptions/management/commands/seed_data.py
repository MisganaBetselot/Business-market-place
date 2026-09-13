from django.core.management.base import BaseCommand

from subscriptions.models import SubscriptionPlan


class Command(BaseCommand):
    """
    Seeds the starter subscription plans so a fresh local database
    (new teammate, reset DB, fresh clone) has working plan data instead
    of the frontend showing "No subscription plans are currently
    available."

    Usage:
        python manage.py migrate
        python manage.py seed_data

    Safe to re-run: uses get_or_create keyed on name, so running this
    twice won't create duplicate plans. If you tweak the price/media_limit
    values below and want existing rows updated too, use --reset.
    """

    help = "Seed starter subscription plans (10-day, 15-day, 1-month)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing SubscriptionPlan rows before seeding.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            deleted_count, _ = SubscriptionPlan.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(
                    f"Deleted {deleted_count} existing subscription plan(s)."
                )
            )

        plans = [
            {
                "name": "10 Days",
                "media_type": SubscriptionPlan.MediaType.PHOTO,
                "duration_days": 10,
                "price": "450.00",
                "media_limit": 3,
                "description": (
                    "Short-term visibility for sellers who want to test "
                    "the marketplace."
                ),
            },
            {
                "name": "15 Days",
                "media_type": SubscriptionPlan.MediaType.PHOTO,
                "duration_days": 15,
                "price": "750.00",
                "media_limit": 5,
                "description": (
                    "More time to reach serious buyers and gather "
                    "qualified inquiries."
                ),
            },
            {
                "name": "1 Month",
                "media_type": SubscriptionPlan.MediaType.VIDEO,
                "duration_days": 30,
                "price": "1200.00",
                "media_limit": 6,
                "description": (
                    "Maximum exposure for businesses that want more time "
                    "to find the right buyer."
                ),
            },
        ]

        created_count = 0
        updated_count = 0

        for plan_data in plans:
            name = plan_data.pop("name")
            plan, created = SubscriptionPlan.objects.get_or_create(
                name=name,
                defaults=plan_data,
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

            plan_data["name"] = name  # restore for logging below

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {created_count} plan(s) created, "
                f"{updated_count} already existed and were left as-is."
            )
        )