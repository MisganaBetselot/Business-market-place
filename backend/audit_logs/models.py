from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    id = models.BigAutoField(primary_key=True)

    admin = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="audit_logs",
)

    action = models.CharField(max_length=100)

    target_type = models.CharField(max_length=100)

    target_id = models.CharField(max_length=100)

    notes = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.target_type}"