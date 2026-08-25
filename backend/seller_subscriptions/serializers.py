from rest_framework import serializers

from .models import SellerSubscription


class SellerSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(
        source="plan.name",
        read_only=True,
    )

    plan_price = serializers.DecimalField(
        source="plan.price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    plan_duration_days = serializers.IntegerField(
        source="plan.duration_days",
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
            "start_date",
            "expiry_date",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "start_date",
            "expiry_date",
            "status",
            "created_at",
            "updated_at",
        ]