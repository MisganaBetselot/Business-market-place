from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "type",
        "is_read",
        "created_at",
    ]

    search_fields = [
        "user__email",
        "message",
    ]

    list_filter = [
        "type",
        "is_read",
        "created_at",
    ]

    readonly_fields = [
        "id",
        "created_at",
    ]

    ordering = ["-created_at"]