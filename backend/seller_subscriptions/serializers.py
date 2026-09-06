from rest_framework import serializers

from listings.serializers import BusinessListingSerializer
from subscriptions.serializers import SubscriptionPlanSerializer

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

    def to_representation(self, instance):
        # FIX: `plan` and `listing` were only ever returned as raw ids,
        # even though the frontend has been coded all along assuming
        # full nested objects (subscription.plan.media_limit,
        # subscription.listing.business_name, .status, .region, etc.).
        # That mismatch is what caused "Untitled listing", missing
        # photo-limit display, and the "Published" step never lighting
        # up - all symptoms of this one gap, not separate bugs.
        #
        # Writes are unaffected: `plan`/`listing` still accept plain ids
        # on POST via the normal PrimaryKeyRelatedField - this only
        # changes what's returned on read.
        data = super().to_representation(instance)
        data["plan"] = SubscriptionPlanSerializer(instance.plan).data
        if instance.listing_id:
            data["listing"] = BusinessListingSerializer(instance.listing).data
        return data