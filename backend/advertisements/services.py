from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from audit_logs.models import AuditLog
from notifications.models import Notification

from .models import Advertisement


def expire_advertisement(advertisement):
    """
    Expire an active advertisement whose end time has passed.
    Keeps the advertisement record for history.
    """
    now = timezone.now()

    if (
        advertisement.status != Advertisement.Status.ACTIVE
        or advertisement.end_at is None
        or advertisement.end_at > now
    ):
        return False

    with transaction.atomic():
        advertisement.status = Advertisement.Status.EXPIRED
        advertisement.save(update_fields=["status", "updated_at"])

        Notification.objects.create(
            user=advertisement.advertiser,
            type="ADVERTISEMENT_EXPIRED",
            message=(
                f"Your advertisement #{advertisement.id} has expired "
                "and is no longer visible."
            ),
        )

        AuditLog.objects.create(
            admin=None,
            action="ADVERTISEMENT_EXPIRED",
            target_type="Advertisement",
            target_id=str(advertisement.id),
            notes=f"Advertisement #{advertisement.id} expired automatically.",
        )

    return True


def expire_due_advertisements():
    """
    Expire all active advertisements whose end time has passed.
    """
    now = timezone.now()

    advertisements = Advertisement.objects.filter(
        status=Advertisement.Status.ACTIVE,
        end_at__isnull=False,
        end_at__lte=now,
    )

    expired_count = 0

    for advertisement in advertisements:
        if expire_advertisement(advertisement):
            expired_count += 1

    return expired_count


def notify_expiring_advertisements():
    """
    Notify advertisers once when an active advertisement
    enters its final 3 days.
    """
    now = timezone.now()
    warning_limit = now + timedelta(days=3)

    advertisements = Advertisement.objects.filter(
        status=Advertisement.Status.ACTIVE,
        end_at__isnull=False,
        end_at__gt=now,
        end_at__lte=warning_limit,
    )

    notified_count = 0

    for advertisement in advertisements:
        already_notified = Notification.objects.filter(
            user=advertisement.advertiser,
            type="ADVERTISEMENT_EXPIRING",
            message__contains=f"advertisement #{advertisement.id}",
        ).exists()

        if already_notified:
            continue

        remaining = advertisement.end_at - now
        remaining_days = max(1, remaining.days)

        Notification.objects.create(
            user=advertisement.advertiser,
            type="ADVERTISEMENT_EXPIRING",
            message=(
                f"Your advertisement #{advertisement.id} will expire "
                f"in approximately {remaining_days} day(s)."
            ),
        )

        notified_count += 1

    return notified_count


def process_advertisements():
    """
    Run advertisement expiration-related background processing.
    """
    expiring_notifications = notify_expiring_advertisements()
    expired = expire_due_advertisements()

    return {
        "expiring_notifications": expiring_notifications,
        "expired": expired,
    }