from rest_framework import serializers
from media.models import Media
from .models import BusinessListing


class MediaSerializer(serializers.ModelSerializer):
    """Nested serializer for listing media (images)."""
    url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = ["id", "url", "thumbnail_url", "media_type", "status"]
        
    def get_url(self, obj):
        if obj.file_path:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file_path.url)
            return obj.file_path.url
        return obj.video_url

    def get_thumbnail_url(self, obj):
        return self.get_url(obj)


class BusinessListingSerializer(serializers.ModelSerializer):
    seller_email = serializers.EmailField(
        source="seller.email",
        read_only=True,
    )

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    images = serializers.SerializerMethodField()

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
            "views",
            "created_at",
            "updated_at",
            "images",
        ]

        read_only_fields = [
            "id",
            "seller",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_images(self, obj):
        """Return only approved media items for public listing."""
        approved_media = obj.media.filter(
            status="APPROVED",
            media_type="PHOTO"
        ).order_by("created_at")
        return MediaSerializer(approved_media, many=True, context=self.context).data