from urllib.parse import urlparse

from django.utils import timezone
from rest_framework import serializers

from .models import Media
import os
MAX_PHOTO_SIZE = 5 * 1024 * 1024

ALLOWED_PHOTO_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

class MediaSerializer(serializers.ModelSerializer):
    listing_name = serializers.CharField(
        source="listing.business_name",
        read_only=True,
    )

    listing_category = serializers.CharField(
        source="listing.category.name",
        read_only=True,
    )

    subscription_status = serializers.CharField(
        source="subscription.status",
        read_only=True,
    )

    photo_limit = serializers.IntegerField(
        source="subscription.plan.photo_limit",
        read_only=True,
    )

    class Meta:
        model = Media

        fields = [
            "id",
            "listing",
            "listing_name",
            "listing_category",
            "subscription",
            "subscription_status",
            "photo_limit",
            "media_type",
            "file_path",
            "external_url",
            "description",
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

        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        user = request.user

        listing = attrs.get("listing")
        subscription = attrs.get("subscription")
        media_type = attrs.get("media_type")
        file_path = attrs.get("file_path")
        external_url = attrs.get("external_url")

        if listing is None:
            raise serializers.ValidationError(
                {"listing": "A business listing is required."}
            )

        if subscription is None:
            raise serializers.ValidationError(
                {"subscription": "An active subscription is required."}
            )

        # The listing must belong to the logged-in seller.
        if listing.seller_id != user.id:
            raise serializers.ValidationError(
                {
                    "listing": (
                        "You can only upload media for your own business."
                    )
                }
            )

        # The subscription must belong to the logged-in seller.
        if subscription.user_id != user.id:
            raise serializers.ValidationError(
                {
                    "subscription": (
                        "This subscription does not belong to you."
                    )
                }
            )

        # The subscription must belong to this business.
        if subscription.business_id != listing.id:
            raise serializers.ValidationError(
                {
                    "subscription": (
                        "This subscription is not assigned to this "
                        "business."
                    )
                }
            )

        # Subscription must be active.
        if subscription.status != subscription.Status.ACTIVE:
            raise serializers.ValidationError(
                {
                    "subscription": (
                        "Your subscription must be ACTIVE to upload media."
                    )
                }
            )

        # Check the actual expiration date as well.
        if (
            subscription.expiry_date is not None
            and subscription.expiry_date <= timezone.now()
        ):
            raise serializers.ValidationError(
                {
                    "subscription": (
                        "Your subscription has expired."
                    )
                }
            )

        if media_type == Media.MediaType.PHOTO:
            # Photos require an uploaded file.
            if not file_path:
                raise serializers.ValidationError(
                    {
                        "file_path": (
                            "A photo file is required for PHOTO media."
                        )
                    }
                )
            if file_path.size > MAX_PHOTO_SIZE:
                raise serializers.ValidationError(
                    {
                        "file_path": (
                            "Photo must be 5 MB or smaller."
                        )
                    }
                )

            extension = os.path.splitext(
                file_path.name
            )[1].lower()

            if extension not in ALLOWED_PHOTO_EXTENSIONS:
                raise serializers.ValidationError(
                    {
                        "file_path": (
                            "Only JPG, JPEG, PNG, and WEBP "
                            "photo files are allowed."
                        )
                    }
                )

            # Photos must not use an external video URL.
            if external_url:
                raise serializers.ValidationError(
                    {
                        "external_url": (
                            "External URLs are only allowed for VIDEO media."
                        )
                    }
                )

            # Enforce the plan's photo limit.
            photo_count = Media.objects.filter(
                subscription=subscription,
                media_type=Media.MediaType.PHOTO,
            ).exclude(
                status=Media.Status.DEACTIVATED
            ).count()

            if photo_count >= subscription.plan.photo_limit:
                raise serializers.ValidationError(
                    {
                        "file_path": (
                            f"This subscription allows a maximum of "
                            f"{subscription.plan.photo_limit} photos."
                        )
                    }
                )

        elif media_type == Media.MediaType.VIDEO:
            # Videos use an external URL, not a file.
            if not subscription.plan.video_link_allowed:
                raise serializers.ValidationError(
                    {
                        "media_type": (
                            "Your subscription plan does not allow "
                            "video links."
                        )
                    }
                )

            if not external_url:
                raise serializers.ValidationError(
                    {
                        "external_url": (
                            "A YouTube or TikTok URL is required "
                            "for VIDEO media."
                        )
                    }
                )

            if file_path:
                raise serializers.ValidationError(
                    {
                        "file_path": (
                            "Video files cannot be uploaded. "
                            "Please provide a YouTube or TikTok URL."
                        )
                    }
                )

            parsed_url = urlparse(external_url)
            hostname = (parsed_url.hostname or "").lower()

            allowed_hosts = {
                "youtube.com",
                "www.youtube.com",
                "m.youtube.com",
                "youtu.be",
                "www.youtu.be",
                "tiktok.com",
                "www.tiktok.com",
                "vm.tiktok.com",
            }

            if hostname not in allowed_hosts and not any(
                hostname.endswith("." + host)
                for host in ["youtube.com", "tiktok.com"]
            ):
                raise serializers.ValidationError(
                    {
                        "external_url": (
                            "Only YouTube and TikTok URLs are allowed."
                        )
                    }
                )

        else:
            raise serializers.ValidationError(
                {
                    "media_type": (
                        "Media type must be PHOTO or VIDEO."
                    )
                }
            )

        return attrs