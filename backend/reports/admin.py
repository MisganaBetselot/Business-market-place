from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "reporter",
        "listing",
        "media",
        "status",
        "reviewed_by",
        "created_at",
        "reviewed_at",
    ]

    search_fields = [
        "reporter__email",
        "listing__business_name",
        "reason",
    ]

    list_filter = [
        "status",
        "created_at",
        "reviewed_at",
    ]

    readonly_fields = [
        "id",
        "created_at",
        "reviewed_at",
    ]

    ordering = ["-created_at"]