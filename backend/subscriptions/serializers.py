from rest_framework import serializers

from .models import SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "media_type",
            "duration_days",
            "media_limit",
            "price",
            "description",
            "is_active",
        ]