from django.contrib import admin

from .models import SubscriptionPlan


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "media_type",
        "duration_days",
        "price",
        "is_active",
    ]

    search_fields = [
        "name",
        "description",
    ]

    list_filter = [
        "media_type",
        "is_active",
        "duration_days",
    ]

    ordering = ["price"]