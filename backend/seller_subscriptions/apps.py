import os
import sys

from django.apps import AppConfig


class SellerSubscriptionsConfig(AppConfig):
    name = 'seller_subscriptions'

    def ready(self):
        # Avoid starting the scheduler for management commands that don't
        # run the server (migrate, makemigrations, test, shell, etc.), and
        # avoid a second scheduler in the reloader's parent process when
        # running `runserver` with the auto-reloader (RUN_MAIN is only set
        # in the actual worker process).
        command = sys.argv[1] if len(sys.argv) > 1 else ""
        is_server_command = command in ("runserver", "gunicorn", "uvicorn")
        reloader_parent = (
            command == "runserver" and os.environ.get("RUN_MAIN") != "true"
        )

        if not is_server_command or reloader_parent:
            return

        from . import scheduler

        scheduler.start()
