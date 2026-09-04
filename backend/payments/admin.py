from django.contrib import admin
from django.utils import timezone

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

    actions = [
        "approve_receipts",
        "reject_receipts",
    ]

    @admin.action(description="Approve selected payment receipts")
    def approve_receipts(self, request, queryset):
        updated = 0

        for receipt in queryset:
            if receipt.status != "APPROVED":
                receipt.status = "APPROVED"
                receipt.reviewed_by = request.user
                receipt.reviewed_at = timezone.now()
                receipt.save()

                # Activate the related subscription
                subscription = receipt.subscription
                subscription.status = "ACTIVE"
                subscription.start_date = timezone.now()

                if subscription.plan and subscription.plan.duration_days:
                    subscription.expiry_date = (
                        timezone.now()
                        + timezone.timedelta(
                            days=subscription.plan.duration_days
                        )
                    )

                subscription.save()

                updated += 1

        self.message_user(
            request,
            f"{updated} payment receipt(s) approved successfully.",
        )

    @admin.action(description="Reject selected payment receipts")
    def reject_receipts(self, request, queryset):
        updated = 0

        for receipt in queryset:
            if receipt.status != "REJECTED":
                receipt.status = "REJECTED"
                receipt.reviewed_by = request.user
                receipt.reviewed_at = timezone.now()
                receipt.save()

                # Keep subscription rejected so seller can correct/re-submit
                subscription = receipt.subscription
                subscription.status = "REJECTED"
                subscription.save()

                updated += 1

        self.message_user(
            request,
            f"{updated} payment receipt(s) rejected successfully.",
        )