from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from audit_logs.models import AuditLog
from media.models import Media
from notifications.models import Notification

from .models import SellerSubscription


EXPIRING_SOON_DAYS = 3


@transaction.atomic
def expire_subscription(subscription):
    if subscription.status != SellerSubscription.Status.ACTIVE:
        return False

    now = timezone.now()

    if (
        subscription.expiry_date is None
        or subscription.expiry_date > now
    ):
        return False

    subscription.status = SellerSubscription.Status.EXPIRED

    subscription.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    Media.objects.filter(
        subscription=subscription,
    ).exclude(
        status=Media.Status.DEACTIVATED,
    ).update(
        status=Media.Status.DEACTIVATED,
    )

    business_name = (
        subscription.business.business_name
        if subscription.business
        else "your business"
    )

    Notification.objects.create(
        user=subscription.user,
        type=Notification.NotificationType.SUBSCRIPTION_EXPIRED,
        message=(
            f"Your subscription for {business_name} has expired. "
            "Your business media has been deactivated. "
            "Purchase a new subscription to continue selling."
        ),
    )

    AuditLog.objects.create(
        admin=None,
        action="SUBSCRIPTION_EXPIRED",
        target_type="SellerSubscription",
        target_id=str(subscription.id),
        notes=(
            f"Subscription #{subscription.id} expired. "
            "Associated media was deactivated automatically."
        ),
    )

    return True


def expire_due_subscriptions():
    now = timezone.now()

    subscriptions = (
        SellerSubscription.objects
        .select_related(
            "user",
            "plan",
            "business",
        )
        .filter(
            status=SellerSubscription.Status.ACTIVE,
            expiry_date__isnull=False,
            expiry_date__lte=now,
        )
    )

    expired_count = 0

    for subscription in subscriptions:
        if expire_subscription(subscription):
            expired_count += 1

    return expired_count


def notify_expiring_subscriptions():
    now = timezone.now()
    expiry_limit = now + timedelta(
        days=EXPIRING_SOON_DAYS
    )

    subscriptions = (
        SellerSubscription.objects
        .select_related(
            "user",
            "plan",
            "business",
        )
        .filter(
            status=SellerSubscription.Status.ACTIVE,
            expiry_date__isnull=False,
            expiry_date__gt=now,
            expiry_date__lte=expiry_limit,
        )
    )

    notified_count = 0

    for subscription in subscriptions:
        existing_notification = Notification.objects.filter(
            user=subscription.user,
            type=Notification.NotificationType.SUBSCRIPTION_EXPIRING,
            message__icontains=f"subscription #{subscription.id}",
        ).exists()

        if existing_notification:
            continue

        business_name = (
            subscription.business.business_name
            if subscription.business
            else "your business"
        )

        days_remaining = (
            subscription.expiry_date.date()
            - now.date()
        ).days

        Notification.objects.create(
            user=subscription.user,
            type=Notification.NotificationType.SUBSCRIPTION_EXPIRING,
            message=(
                f"Your subscription #{subscription.id} for "
                f"{business_name} expires in approximately "
                f"{max(days_remaining, 0)} day(s). "
                "Purchase a new subscription to continue selling."
            ),
        )

        notified_count += 1

    return notified_count