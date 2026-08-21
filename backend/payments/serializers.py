from rest_framework import serializers

from .models import PaymentReceipt


class PaymentReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentReceipt
        fields = [
            "id",
            "user",
            "subscription",
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
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]