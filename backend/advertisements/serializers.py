from urllib.parse import urlparse

from django.utils import timezone
from rest_framework import serializers

from .models import (
    Advertisement,
    AdvertisementPayment,
    AdvertisementPlan,
)


class AdvertisementPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvertisementPlan
        fields = [
            "id",
            "name",
            "ad_type",
            "duration_days",
            "price",
            "slide_duration_seconds",
            "max_slots",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        ad_type = attrs.get(
            "ad_type",
            getattr(self.instance, "ad_type", None),
        )

        if ad_type == AdvertisementPlan.AdType.DEDICATED:
            attrs["max_slots"] = 1

        return attrs


class PublicAdvertisementPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvertisementPlan
        fields = [
            "id",
            "name",
            "ad_type",
            "duration_days",
            "price",
            "slide_duration_seconds",
            "max_slots",
            "description",
        ]


class AdvertisementSerializer(serializers.ModelSerializer):
    advertiser_email = serializers.EmailField(
        source="advertiser.email",
        read_only=True,
    )
    plan_name = serializers.CharField(
        source="plan.name",
        read_only=True,
    )
    ad_type = serializers.CharField(
        source="plan.ad_type",
        read_only=True,
    )

    class Meta:
        model = Advertisement
        fields = [
            "id",
            "advertiser",
            "advertiser_email",
            "plan",
            "plan_name",
            "ad_type",
            "title",
            "description",
            "image_url",
            "target_url",
            "status",
            "start_at",
            "end_at",
            "priority",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "advertiser",
            "advertiser_email",
            "status",
            "start_at",
            "end_at",
            "priority",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        start_at = attrs.get(
            "start_at",
            getattr(self.instance, "start_at", None),
        )
        end_at = attrs.get(
            "end_at",
            getattr(self.instance, "end_at", None),
        )

        if start_at and end_at and end_at <= start_at:
            raise serializers.ValidationError(
                {"end_at": "End time must be after start time."}
            )

        return attrs


class PublicAdvertisementSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(
        source="plan.name",
        read_only=True,
    )
    ad_type = serializers.CharField(
        source="plan.ad_type",
        read_only=True,
    )
    slide_duration_seconds = serializers.IntegerField(
        source="plan.slide_duration_seconds",
        read_only=True,
    )

    class Meta:
        model = Advertisement
        fields = [
            "id",
            "title",
            "description",
            "image_url",
            "target_url",
            "priority",
            "start_at",
            "end_at",
            "plan_name",
            "ad_type",
            "slide_duration_seconds",
        ]


class AdvertisementPaymentSerializer(serializers.ModelSerializer):
    advertiser_email = serializers.EmailField(
        source="advertiser.email",
        read_only=True,
    )

    class Meta:
        model = AdvertisementPayment
        fields = [
            "id",
            "advertisement",
            "advertiser",
            "advertiser_email",
            "receipt_file",
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "advertiser",
            "advertiser_email",
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]

    def validate_advertisement(self, advertisement):
        request = self.context["request"]

        if advertisement.advertiser_id != request.user.id:
            raise serializers.ValidationError(
                "You can only submit payment for your own advertisement."
            )

        if advertisement.status != Advertisement.Status.PENDING_PAYMENT:
            raise serializers.ValidationError(
                "Payment can only be submitted for an advertisement "
                "that is awaiting payment."
            )

        existing_pending = AdvertisementPayment.objects.filter(
            advertisement=advertisement,
            status=AdvertisementPayment.Status.PENDING,
        ).exists()

        if existing_pending:
            raise serializers.ValidationError(
                "A payment receipt is already pending for this advertisement."
            )

        return advertisement

    def validate_receipt_file(self, value):
        max_size = 5 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Receipt file must not exceed 5 MB."
            )

        allowed_extensions = {
            ".jpg",
            ".jpeg",
            ".png",
            ".pdf",
        }

        filename = value.name.lower()
        extension = ""

        if "." in filename:
            extension = filename[filename.rfind("."):]

        if extension not in allowed_extensions:
            raise serializers.ValidationError(
                "Receipt must be a JPG, JPEG, PNG, or PDF file."
            )

        return value


class AdvertisementPaymentAdminSerializer(
    serializers.ModelSerializer
):
    advertiser_email = serializers.EmailField(
        source="advertiser.email",
        read_only=True,
    )
    advertisement_title = serializers.CharField(
        source="advertisement.title",
        read_only=True,
    )

    class Meta:
        model = AdvertisementPayment
        fields = [
            "id",
            "advertisement",
            "advertisement_title",
            "advertiser",
            "advertiser_email",
            "receipt_file",
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "advertisement_title",
            "advertiser",
            "advertiser_email",
            "reviewed_by",
            "reviewed_at",
            "created_at",
        ]