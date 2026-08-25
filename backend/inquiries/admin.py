from django.contrib import admin

from .models import Inquiry


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "listing",
        "buyer",
        "seller",
        "is_read",
        "created_at",
    ]

    search_fields = [
        "listing__business_name",
        "buyer__email",
        "seller__email",
        "message",
    ]

    list_filter = [
        "is_read",
        "created_at",
    ]

    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
    ]

    ordering = ["-created_at"]