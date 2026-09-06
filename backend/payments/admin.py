from django.contrib import admin
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.utils import timezone

from audit_logs.models import AuditLog
from notifications.models import Notification

from .models import PaymentReceipt

PRESET_REJECTION_REASONS = [
    "Receipt image is blurry or unreadable.",
    "Amount does not match the selected plan.",
    "Wrong account number or reference used.",
    "Receipt appears altered or unauthentic.",
    "Image shows unrelated or inappropriate content.",
]


def _approve_one(receipt, admin_user, now):
    """Same effect as PaymentReceiptApproveView - kept in sync manually."""
    receipt.status = PaymentReceipt.Status.APPROVED
    receipt.reviewed_by = admin_user
    receipt.reviewed_at = now
    receipt.rejection_reason = None
    receipt.save()

    subscription = receipt.subscription
    subscription.status = "ACTIVE"
    subscription.start_date = now
    if subscription.plan and subscription.plan.duration_days:
        subscription.expiry_date = now + timezone.timedelta(
            days=subscription.plan.duration_days
        )
    subscription.save()

    AuditLog.objects.create(
        admin=admin_user,
        action="PAYMENT_RECEIPT_APPROVED",
        target_type="PaymentReceipt",
        target_id=str(receipt.id),
        notes=(
            f"Payment receipt approved (via admin panel). "
            f"Subscription #{subscription.id} activated."
        ),
    )

    Notification.objects.create(
        user=receipt.user,
        type="PAYMENT_APPROVED",
        message="Your payment has been approved. Your subscription is now active.",
    )


def _reject_one(receipt, admin_user, now, reason):
    """Same effect as PaymentReceiptRejectView - kept in sync manually."""
    receipt.status = PaymentReceipt.Status.REJECTED
    receipt.reviewed_by = admin_user
    receipt.reviewed_at = now
    receipt.rejection_reason = reason
    receipt.save()

    subscription = receipt.subscription
    subscription.status = "REJECTED"
    subscription.save()

    AuditLog.objects.create(
        admin=admin_user,
        action="PAYMENT_RECEIPT_REJECTED",
        target_type="PaymentReceipt",
        target_id=str(receipt.id),
        notes=f"Payment receipt rejected (via admin panel). Reason: {reason}",
    )

    Notification.objects.create(
        user=receipt.user,
        type="PAYMENT_REJECTED",
        message=f"Your payment was rejected. Reason: {reason}",
    )


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
        now = timezone.now()
        pending = queryset.exclude(status=PaymentReceipt.Status.APPROVED)
        skipped = queryset.filter(status=PaymentReceipt.Status.APPROVED).count()

        count = 0
        for receipt in pending.select_related("subscription__plan", "user"):
            _approve_one(receipt, request.user, now)
            count += 1

        message = f"{count} payment receipt(s) approved successfully."
        if skipped:
            message += f" Skipped {skipped} already-approved item(s)."
        self.message_user(request, message)

    @admin.action(description="Reject selected payment receipts")
    def reject_receipts(self, request, queryset):
        # FIX: previously rejected with NO reason captured at all (the
        # model has a rejection_reason field, it was just never set),
        # and never notified the seller or logged the action. Uses the
        # same intermediate confirmation page pattern as media/admin.py.
        if "apply" in request.POST:
            reason = request.POST.get("rejection_reason", "").strip()
            if not reason:
                self.message_user(request, "Rejection reason is required - nothing was rejected.")
                return None

            now = timezone.now()
            pending = queryset.exclude(status=PaymentReceipt.Status.REJECTED)
            skipped = queryset.filter(status=PaymentReceipt.Status.REJECTED).count()

            count = 0
            for receipt in pending.select_related("subscription", "user"):
                _reject_one(receipt, request.user, now, reason)
                count += 1

            message = f"{count} payment receipt(s) rejected successfully."
            if skipped:
                message += f" Skipped {skipped} already-rejected item(s)."
            self.message_user(request, message)
            return None

        selected_ids = request.POST.getlist(admin.helpers.ACTION_CHECKBOX_NAME)
        ids_inputs = "".join(
            f'<input type="hidden" name="_selected_action" value="{pk}">'
            for pk in selected_ids
        )
        preset_options = "".join(
            f'<option value="{reason}">{reason}</option>' for reason in PRESET_REJECTION_REASONS
        )
        html = f"""
        <html>
        <body style="font-family: sans-serif; padding: 2rem;">
            <h2>Reject {len(selected_ids)} payment receipt(s)</h2>
            <form method="post">
                <input type="hidden" name="action" value="reject_receipts">
                {ids_inputs}
                <input type="hidden" name="csrfmiddlewaretoken" value="{get_token(request)}">

                <label for="preset">Common reasons:</label><br>
                <select id="preset" onchange="document.getElementById('rejection_reason').value = this.value">
                    <option value="">— choose a preset, or write your own below —</option>
                    {preset_options}
                </select><br><br>

                <label for="rejection_reason">Rejection reason (applied to all selected):</label><br>
                <textarea name="rejection_reason" id="rejection_reason" rows="4" cols="60" required></textarea><br><br>

                <button type="submit" name="apply" value="1">Confirm Reject</button>
                <a href="../">Cancel</a>
            </form>
        </body>
        </html>
        """
        return HttpResponse(html)