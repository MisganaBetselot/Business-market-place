from django.contrib import admin

from .models import SellerSubscription


@admin.register(SellerSubscription)
class SellerSubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "plan",
        "status",
        "start_date",
        "expiry_date",
        "created_at",
    ]

    search_fields = [
        "user__email",
        "plan__name",
    ]

    list_filter = [
        "status",
        "plan",
        "created_at",
        "expiry_date",
    ]

    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
    ]

    ordering = ["-created_at"]