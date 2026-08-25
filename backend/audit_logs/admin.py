from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "admin",
        "action",
        "target_type",
        "target_id",
        "created_at",
    ]

    search_fields = [
        "admin__email",
        "action",
        "target_type",
        "target_id",
        "notes",
    ]

    list_filter = [
        "action",
        "target_type",
        "created_at",
    ]

    readonly_fields = [
        "id",
        "admin",
        "action",
        "target_type",
        "target_id",
        "notes",
        "created_at",
    ]

    ordering = ["-created_at"]