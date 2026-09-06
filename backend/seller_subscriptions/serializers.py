from rest_framework import serializers

from .models import SellerSubscription


class SellerSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    plan_price = serializers.DecimalField(source="plan.price", max_digits=10, decimal_places=2, read_only=True)
    plan_duration_days = serializers.IntegerField(source="plan.duration_days", read_only=True)

    class Meta:
        model = SellerSubscription
        fields = [
            "id", "user", "plan", "plan_name", "plan_price", "plan_duration_days",
            "listing", "start_date", "expiry_date", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user", "start_date", "expiry_date", "status", "created_at", "updated_at"]
        extra_kwargs = {
            # The model field is null=True/blank=True (needed only to let
            # OLD rows exist without a listing after that migration) — but
            # every NEW subscription created through the API must still
            # require one. ModelSerializer would otherwise infer
            # required=False from the model's blank=True, which is what
            # let a missing `listing` silently pass validation and reach
            # perform_create() as an absent key, causing the KeyError.
            "listing": {"required": True, "allow_null": False},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        listing = attrs.get("listing")
        if listing and listing.seller != request.user:
            raise serializers.ValidationError(
                "You can only create a subscription for your own listing."
            )
        return attrs