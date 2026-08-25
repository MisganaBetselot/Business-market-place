from django.core.management.base import BaseCommand
from django.utils import timezone

from seller_subscriptions.models import SellerSubscription
from notifications.models import Notification


class Command(BaseCommand):
    help = "Process expiring and expired seller subscriptions."

    def handle(self, *args, **options):
        now = timezone.now()

        # Mark active subscriptions as expired
        expired_subscriptions = SellerSubscription.objects.filter(
            status=SellerSubscription.Status.ACTIVE,
            expiry_date__isnull=False,
            expiry_date__lte=now,
        )

        expired_count = 0

        for subscription in expired_subscriptions:
            subscription.status = SellerSubscription.Status.EXPIRED
            subscription.save(
                update_fields=["status", "updated_at"]
            )

            Notification.objects.create(
                user=subscription.user,
                type=Notification.NotificationType.SUBSCRIPTION_EXPIRED,
                message=(
                    f"Your {subscription.plan.name} subscription has expired."
                ),
            )

            expired_count += 1

        # Notify sellers whose subscriptions will expire soon.
        # Currently this checks subscriptions expiring within 3 days.
        expiring_limit = now + timezone.timedelta(days=3)

        expiring_subscriptions = SellerSubscription.objects.filter(
            status=SellerSubscription.Status.ACTIVE,
            expiry_date__gt=now,
            expiry_date__lte=expiring_limit,
        )

        expiring_count = 0

        for subscription in expiring_subscriptions:
            already_notified = Notification.objects.filter(
                user=subscription.user,
                type=Notification.NotificationType.SUBSCRIPTION_EXPIRING,
                message__icontains=subscription.plan.name,
                created_at__date=now.date(),
            ).exists()

            if not already_notified:
                Notification.objects.create(
                    user=subscription.user,
                    type=Notification.NotificationType.SUBSCRIPTION_EXPIRING,
                    message=(
                        f"Your {subscription.plan.name} subscription "
                        f"will expire on "
                        f"{subscription.expiry_date.strftime('%Y-%m-%d')}."
                    ),
                )

                expiring_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Subscription processing complete. "
                f"Expired: {expired_count}, "
                f"Expiring notifications: {expiring_count}"
            )
        )