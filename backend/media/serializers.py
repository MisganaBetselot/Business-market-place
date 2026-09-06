from django.utils import timezone
from rest_framework import serializers

from .models import Media


class MediaSerializer(serializers.ModelSerializer):
    listing_name = serializers.CharField(
        source="listing.business_name",
        read_only=True,
    )

    subscription_status = serializers.CharField(
        source="subscription.status",
        read_only=True,
    )

    class Meta:
        model = Media
        fields = [
            "id",
            "listing",
            "listing_name",
            "subscription",
            "subscription_status",
            "media_type",
            "file_path",
            "video_url",
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user

        listing = attrs.get("listing")
        subscription = attrs.get("subscription")
        media_type = attrs.get("media_type")

        # Make sure the listing belongs to the logged-in seller
        if listing.seller != user:
            raise serializers.ValidationError(
                "You can only upload media for your own listing."
            )

        # Make sure the subscription belongs to the logged-in seller
        if subscription.user != user:
            raise serializers.ValidationError(
                "This subscription does not belong to you."
            )

        # Make sure the subscription belongs to the listing's seller
        if subscription.user != listing.seller:
            raise serializers.ValidationError(
                "This subscription does not belong to the listing's seller."
            )

        # Subscription must be active
        if subscription.status != "ACTIVE":
            raise serializers.ValidationError(
                "Your subscription must be ACTIVE to upload media."
            )

        # Subscription must not be expired
        if (
            subscription.expiry_date is not None
            and subscription.expiry_date <= timezone.now()
        ):
            raise serializers.ValidationError(
                "Your subscription has expired."
            )

        # Check media type against subscription plan
        # FIX: video links are meant to be independent of the plan
        # type now (per product direction — plans are duration-only,
        # video is an optional extra any seller can add, not a
        # separate "video plan"). Only PHOTO uploads still need to
        # match the plan's media_type; VIDEO links are allowed
        # regardless of what type the plan is.
        if media_type == Media.MediaType.PHOTO and subscription.plan.media_type != media_type:
            raise serializers.ValidationError(
                f"This subscription only allows "
                f"{subscription.plan.media_type.lower()} uploads."
            )

        # Check photo limit
        # FIX: was counting by subscription, but a single subscription
        # can end up associated with multiple listings (subscriptions
        # aren't currently tied 1:1 to a specific listing - confirmed
        # live, subscription 6 was shared across listings 31/32/33).
        # The plan's media allowance is meant to apply per LISTING (see
        # "every business listing carries its own... media allowance"
        # on SubscriptionStatus.jsx) - so count by listing, not
        # subscription, so each listing gets its own fresh allowance.
        #
        # FIX 2: REJECTED photos were counting against the limit
        # forever, blocking sellers from ever uploading a replacement
        # once they'd hit the limit even once (confirmed live: 6 total
        # uploads against a limit of 3, several rejected, upload still
        # blocked). A rejected photo isn't going public, so it
        # shouldn't count toward "how many photos does this listing
        # have" - excluding it here.
        if media_type == Media.MediaType.PHOTO:
            media_limit = subscription.plan.media_limit

            if media_limit is not None:
                existing_photo_count = Media.objects.filter(
                    listing=listing,
                    media_type=Media.MediaType.PHOTO,
                ).exclude(status=Media.Status.REJECTED).count()

                if existing_photo_count >= media_limit:
                    raise serializers.ValidationError(
                        f"You have reached the maximum of {media_limit} photos "
                        f"allowed by your subscription plan."
                    )

        return attrs