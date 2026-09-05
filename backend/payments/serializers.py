from rest_framework import serializers

from .models import PaymentReceipt


MAX_RECEIPT_SIZE = 5 * 1024 * 1024

ALLOWED_RECEIPT_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
}


class PaymentReceiptSerializer(serializers.ModelSerializer):
    subscription_status = serializers.CharField(
        source="subscription.status",
        read_only=True,
    )

    plan_name = serializers.CharField(
        source="subscription.plan.name",
        read_only=True,
    )

    business_name = serializers.CharField(
        source="subscription.business.business_name",
        read_only=True,
    )

    class Meta:
        model = PaymentReceipt

        fields = [
            "id",
            "user",
            "subscription",
            "subscription_status",
            "plan_name",
            "business_name",
            "receipt_file",
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "subscription_status",
            "plan_name",
            "business_name",
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]

    def validate_receipt_file(self, value):
        if value.size > MAX_RECEIPT_SIZE:
            raise serializers.ValidationError(
                "Receipt file must be 5 MB or smaller."
            )

        filename = value.name.lower()

        if not any(
            filename.endswith(extension)
            for extension in ALLOWED_RECEIPT_EXTENSIONS
        ):
            raise serializers.ValidationError(
                "Only JPG, JPEG, PNG, and PDF receipt files are allowed."
            )

        return value