from rest_framework import serializers

from .models import SellerSubscription


class SellerSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(
        source="plan.name",
        read_only=True,
    )

    plan_price = serializers.DecimalField(
        source="plan.price",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    plan_duration_days = serializers.IntegerField(
        source="plan.duration_days",
        read_only=True,
    )

    photo_limit = serializers.IntegerField(
        source="plan.photo_limit",
        read_only=True,
    )

    video_link_allowed = serializers.BooleanField(
        source="plan.video_link_allowed",
        read_only=True,
    )

    business_name = serializers.CharField(
        source="business.business_name",
        read_only=True,
    )

    class Meta:
        model = SellerSubscription

        fields = [
            "id",
            "user",
            "plan",
            "plan_name",
            "plan_price",
            "plan_duration_days",
            "photo_limit",
            "video_link_allowed",
            "business",
            "business_name",
            "start_date",
            "expiry_date",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "plan_name",
            "plan_price",
            "plan_duration_days",
            "photo_limit",
            "video_link_allowed",
            "business_name",
            "start_date",
            "expiry_date",
            "status",
            "created_at",
            "updated_at",
        ]