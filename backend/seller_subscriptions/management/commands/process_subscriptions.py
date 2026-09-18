from django.core.management.base import BaseCommand

from seller_subscriptions.services import process_subscription_expirations


class Command(BaseCommand):
    help = "Process expiring and expired seller subscriptions."

    def handle(self, *args, **options):
        expired_count, expiring_count = process_subscription_expirations()

        self.stdout.write(
            self.style.SUCCESS(
                f"Subscription processing complete. "
                f"Expired: {expired_count}, "
                f"Expiring notifications: {expiring_count}"
            )
        )
