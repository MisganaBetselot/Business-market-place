from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(
        source="admin.email",
        read_only=True,
    )

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "admin",
            "admin_email",
            "action",
            "target_type",
            "target_id",
            "notes",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "admin",
            "admin_email",
            "created_at",
        ]