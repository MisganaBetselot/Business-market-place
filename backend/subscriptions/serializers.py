from rest_framework import serializers

from .models import SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "duration_days",
            "price",
            "photo_limit",
            "video_link_allowed",
            "description",
            "is_active",
        ]
        read_only_fields = ["id"]

    def validate_duration_days(self, value):
        if value < 1 or value > 31:
            raise serializers.ValidationError(
                "Subscription duration must be between 1 and 31 days."
            )

        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Price cannot be negative."
            )

        return value

    def validate_photo_limit(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Photo limit must be at least 1."
            )

        return value