from django.contrib import admin

from .models import SubscriptionPlan


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "duration_days",
        "photo_limit",
        "video_link_allowed",
        "price",
        "is_active",
    ]

    search_fields = [
        "name",
        "description",
    ]

    list_filter = [
        "is_active",
        "video_link_allowed",
        "duration_days",
    ]

    ordering = ["price"]