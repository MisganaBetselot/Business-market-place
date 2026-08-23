from rest_framework import serializers

from .models import Inquiry


class InquirySerializer(serializers.ModelSerializer):
    buyer_email = serializers.EmailField(
        source="buyer.email",
        read_only=True,
    )

    seller_email = serializers.EmailField(
        source="seller.email",
        read_only=True,
    )

    listing_name = serializers.CharField(
        source="listing.business_name",
        read_only=True,
    )

    class Meta:
        model = Inquiry
        fields = [
            "id",
            "listing",
            "listing_name",
            "buyer",
            "buyer_email",
            "seller",
            "seller_email",
            "message",
            "is_read",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "buyer",
            "seller",
            "is_read",
            "created_at",
            "updated_at",
        ]