from django.contrib import admin

from .models import PaymentReceipt


@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "subscription",
        "status",
        "reviewed_by",
        "reviewed_at",
        "created_at",
    ]

    search_fields = [
        "user__email",
        "subscription__plan__name",
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