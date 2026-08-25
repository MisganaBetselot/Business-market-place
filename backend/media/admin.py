from django.contrib import admin

from .models import Media


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "listing",
        "media_type",
        "status",
        "reviewed_by",
        "reviewed_at",
        "created_at",
    ]

    search_fields = [
        "listing__business_name",
        "listing__seller__email",
    ]

    list_filter = [
        "media_type",
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