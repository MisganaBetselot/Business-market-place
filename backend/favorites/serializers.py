from rest_framework import serializers

from .models import Favorite
from listings.models import BusinessListing


class FavoriteSerializer(serializers.ModelSerializer):
    listing_name = serializers.CharField(
        source="listing.business_name",
        read_only=True,
    )
    listing_status = serializers.CharField(
        source="listing.status",
        read_only=True,
    )

    class Meta:
        model = Favorite
        fields = [
            "id",
            "listing",
            "listing_name",
            "listing_status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "listing_name",
            "listing_status",
            "created_at",
        ]

    def validate_listing(self, listing):
        if listing.status != BusinessListing.Status.ACTIVE:
            raise serializers.ValidationError(
                "Only active listings can be added to favorites."
            )

        user = self.context["request"].user

        if Favorite.objects.filter(
            user=user,
            listing=listing,
        ).exists():
            raise serializers.ValidationError(
                "This listing is already in your favorites."
            )

        return listing

    def create(self, validated_data):
        return Favorite.objects.create(
            user=self.context["request"].user,
            **validated_data,
        )