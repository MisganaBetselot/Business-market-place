from django.core.management.base import BaseCommand

from advertisements.services import process_advertisements
from seller_subscriptions.services import (
    expire_due_subscriptions,
    notify_expiring_subscriptions,
)


class Command(BaseCommand):
    help = (
        "Process expiring seller subscriptions and "
        "advertisements."
    )

    def handle(self, *args, **options):
        # --------------------------------------------------
        # Seller subscriptions
        # --------------------------------------------------

        expiring_subscriptions = notify_expiring_subscriptions()
        expired_subscriptions = expire_due_subscriptions()

        # --------------------------------------------------
        # Advertisements
        # --------------------------------------------------

        advertisement_result = process_advertisements()

        self.stdout.write(
            self.style.SUCCESS(
                "Subscription and advertisement processing completed."
            )
        )

        self.stdout.write(
            f"Subscription expiry notifications sent: "
            f"{expiring_subscriptions}"
        )

        self.stdout.write(
            f"Subscriptions expired: "
            f"{expired_subscriptions}"
        )

        self.stdout.write(
            f"Advertisement expiry notifications sent: "
            f"{advertisement_result['expiring_notifications']}"
        )

        self.stdout.write(
            f"Advertisements expired: "
            f"{advertisement_result['expired']}"
        )