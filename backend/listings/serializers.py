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

    approved_media = serializers.SerializerMethodField()

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
            "approved_media",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "seller",
            "status",
            "approved_media",
            "created_at",
            "updated_at",
        ]

    def get_approved_media(self, obj):
        media_items = getattr(
            obj,
            "approved_media",
            obj.media.filter(
                status="APPROVED"
            ).select_related("subscription__plan"),
        )

        request = self.context.get("request")

        results = []

        for media in media_items:
            file_url = None

            if media.file_path:
                file_url = media.file_path.url

                if request:
                    file_url = request.build_absolute_uri(
                        file_url
                    )

            results.append(
                {
                    "id": media.id,
                    "media_type": media.media_type,
                    "file_path": file_url,
                    "external_url": media.external_url,
                    "description": media.description,
                    "status": media.status,
                    "created_at": media.created_at,
                }
            )

        return results