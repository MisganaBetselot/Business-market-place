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
        if subscription.plan.media_type != media_type:
            raise serializers.ValidationError(
                f"This subscription only allows "
                f"{subscription.plan.media_type.lower()} uploads."
            )

        return attrs