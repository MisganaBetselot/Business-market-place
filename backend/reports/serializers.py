from rest_framework import serializers

from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    reporter_email = serializers.EmailField(
        source="reporter.email",
        read_only=True,
    )

    listing_name = serializers.CharField(
        source="listing.business_name",
        read_only=True,
    )

    media_file = serializers.FileField(
        source="media.file_path",
        read_only=True,
    )

    reviewed_by_email = serializers.EmailField(
        source="reviewed_by.email",
        read_only=True,
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "reporter",
            "reporter_email",
            "listing",
            "listing_name",
            "media",
            "media_file",
            "reason",
            "status",
            "reviewed_by",
            "reviewed_by_email",
            "created_at",
            "reviewed_at",
        ]

        read_only_fields = [
            "id",
            "reporter",
            "reporter_email",
            "status",
            "reviewed_by",
            "reviewed_by_email",
            "created_at",
            "reviewed_at",
        ]

    def validate(self, attrs):
        listing = attrs.get("listing")
        media = attrs.get("media")

        if not listing and not media:
            raise serializers.ValidationError(
                "You must report either a listing or media."
            )

        if listing and media:
            if media.listing_id != listing.id:
                raise serializers.ValidationError(
                    "The selected media does not belong to the selected listing."
                )

        return attrs