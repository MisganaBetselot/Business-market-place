from django.contrib import admin
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.utils import timezone

from audit_logs.models import AuditLog
from notifications.models import Notification
from listings.models import BusinessListing

from .models import Media


def _approve_one(media, admin_user, now):
    """Same logic as MediaApproveView - kept in sync manually. If this
    view's approval logic ever changes, update both places."""
    media.status = Media.Status.APPROVED
    media.reviewed_by = admin_user
    media.reviewed_at = now
    media.rejection_reason = None
    media.save()

    listing = media.listing
    listing_was_published = False
    if listing.status == BusinessListing.Status.DRAFT:
        listing.status = BusinessListing.Status.ACTIVE
        listing.save(update_fields=["status", "updated_at"])
        listing_was_published = True

    AuditLog.objects.create(
        admin=admin_user,
        action="MEDIA_APPROVED",
        target_type="Media",
        target_id=str(media.id),
        notes=(
            f"Media for {listing.business_name} approved (via admin panel)."
            + (" Listing published (DRAFT -> ACTIVE)." if listing_was_published else "")
        ),
    )

    Notification.objects.create(
        user=listing.seller,
        type=Notification.NotificationType.MEDIA_APPROVED,
        message=(
            f"Your media for {listing.business_name} has been approved "
            "and your listing is now live."
            if listing_was_published
            else f"Your media for {listing.business_name} has been approved."
        ),
    )


def _reject_one(media, admin_user, now, reason):
    """Same logic as MediaRejectView - kept in sync manually."""
    media.status = Media.Status.REJECTED
    media.reviewed_by = admin_user
    media.reviewed_at = now
    media.rejection_reason = reason
    media.save()

    AuditLog.objects.create(
        admin=admin_user,
        action="MEDIA_REJECTED",
        target_type="Media",
        target_id=str(media.id),
        notes=f"Media for {media.listing.business_name} rejected (via admin panel). Reason: {reason}",
    )

    Notification.objects.create(
        user=media.listing.seller,
        type=Notification.NotificationType.MEDIA_REJECTED,
        message=(
            f"Your media for {media.listing.business_name} has been "
            f"rejected. Reason: {reason}"
        ),
    )


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

    actions = ["approve_selected", "reject_selected"]

    @admin.action(description="Approve selected media")
    def approve_selected(self, request, queryset):
        now = timezone.now()
        pending = queryset.filter(status=Media.Status.PENDING_REVIEW)
        skipped = queryset.exclude(status=Media.Status.PENDING_REVIEW).count()

        for media in pending.select_related("listing", "listing__seller"):
            _approve_one(media, request.user, now)

        approved_count = pending.count()
        message = f"Approved {approved_count} item(s)."
        if skipped:
            message += f" Skipped {skipped} already-reviewed item(s)."
        self.message_user(request, message)

    @admin.action(description="Reject selected media")
    def reject_selected(self, request, queryset):
        # Rejection needs a reason, so bulk-reject uses a simple
        # intermediate confirmation page (no separate template file
        # needed - kept self-contained here as raw HTML) instead of
        # rejecting immediately like approve does.
        if "apply" in request.POST:
            reason = request.POST.get("rejection_reason", "").strip()
            if not reason:
                self.message_user(request, "Rejection reason is required - nothing was rejected.")
                return None

            now = timezone.now()
            pending = queryset.filter(status=Media.Status.PENDING_REVIEW)
            skipped = queryset.exclude(status=Media.Status.PENDING_REVIEW).count()

            for media in pending.select_related("listing", "listing__seller"):
                _reject_one(media, request.user, now, reason)

            rejected_count = pending.count()
            message = f"Rejected {rejected_count} item(s)."
            if skipped:
                message += f" Skipped {skipped} already-reviewed item(s)."
            self.message_user(request, message)
            return None

        selected_ids = request.POST.getlist(admin.helpers.ACTION_CHECKBOX_NAME)
        ids_inputs = "".join(
            f'<input type="hidden" name="_selected_action" value="{pk}">'
            for pk in selected_ids
        )
        html = f"""
        <html>
        <body style="font-family: sans-serif; padding: 2rem;">
            <h2>Reject {len(selected_ids)} media item(s)</h2>
            <form method="post">
                <input type="hidden" name="action" value="reject_selected">
                {ids_inputs}
                <input type="hidden" name="csrfmiddlewaretoken" value="{get_token(request)}">
                <label for="rejection_reason">Rejection reason (applied to all selected):</label><br>
                <textarea name="rejection_reason" id="rejection_reason" rows="4" cols="60" required></textarea><br><br>
                <button type="submit" name="apply" value="1">Confirm Reject</button>
                <a href="../">Cancel</a>
            </form>
        </body>
        </html>
        """
        return HttpResponse(html)