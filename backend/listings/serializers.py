from rest_framework import serializers

from .models import BusinessListing


class BusinessListingSerializer(serializers.ModelSerializer):
    seller_email = serializers.EmailField(
        source="seller.email",
        read_only=True,
    )

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    class Meta:
        model = BusinessListing
        fields = [
            "id",
            "seller",
            "seller_email",
            "category",
            "category_name",
            "business_name",
            "description",
            "asking_price",
            "region",
            "city",
            "area",
            "address",
            "phone",
            "whatsapp",
            "contact_email",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "seller",
            "status",
            "created_at",
            "updated_at",
        ]