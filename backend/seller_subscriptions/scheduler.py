import logging

from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

_scheduler = None


def _run_job():
    # Imported here (not at module load time) so Django's app registry is
    # fully populated before any models are touched.
    from .services import process_subscription_expirations

    try:
        expired_count, expiring_count = process_subscription_expirations()
        logger.info(
            "process_subscription_expirations: expired=%s expiring=%s",
            expired_count,
            expiring_count,
        )
    except Exception:
        # A scheduled job must never crash the background thread it runs
        # on - log it and let the next scheduled run try again.
        logger.exception("process_subscription_expirations failed")


def start():
    """
    Start the background job that expires subscriptions and sends
    expiring/expired notifications to sellers.

    Runs once shortly after startup and then every hour. Safe to call more
    than once - only starts a single scheduler per process.
    """
    global _scheduler

    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        _run_job,
        trigger="interval",
        hours=1,
        next_run_time=None,  # first run is scheduled explicitly below
        id="process_subscription_expirations",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    # Run once right away (in a few seconds) so expired/expiring
    # notifications don't wait a full hour after a fresh server start.
    import datetime

    _scheduler.modify_job(
        "process_subscription_expirations",
        next_run_time=datetime.datetime.now() + datetime.timedelta(seconds=10),
    )
    _scheduler.start()
    logger.info("Seller subscription expiry scheduler started.")
