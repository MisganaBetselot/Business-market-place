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
    seller_name = serializers.SerializerMethodField()

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    images = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()

    def get_seller_name(self, obj):
        first = (obj.seller.first_name or "").strip()
        last = (obj.seller.last_name or "").strip()
        full = f"{first} {last}".strip()
        return full or obj.seller.email
    class Meta:
        model = BusinessListing
        fields = [
            "id",
            "seller",
            "seller_email",
            "seller_name",
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
            "video_url",
        ]

        read_only_fields = [
            "id",
            "seller",
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

    def get_video_url(self, obj):
        """Return the most recent approved video for public listing, if any.

        Video is submitted as a link (video_url), not an uploaded file —
        confirmed against the seller media-upload flow, which always sends
        VIDEO items with video_url set and no file. get_images() above
        deliberately excludes VIDEO items, so this is the only place a
        listing's video is exposed to the public detail page.
        """
        video = obj.media.filter(
            status="APPROVED",
            media_type="VIDEO",
        ).order_by("-created_at").first()

        if not video:
            return None

        if video.file_path:
            request = self.context.get("request")
            return request.build_absolute_uri(video.file_path.url) if request else video.file_path.url

        return video.video_url