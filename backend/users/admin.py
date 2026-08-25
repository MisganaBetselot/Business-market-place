from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-created_at"]
    list_display = [
        "email",
        "first_name",
        "last_name",
        "phone",
        "is_admin",
        "is_active",
        "is_staff",
        "created_at",
    ]
    search_fields = [
        "email",
        "first_name",
        "last_name",
        "phone",
    ]
    list_filter = [
        "is_admin",
        "is_active",
        "is_staff",
        "created_at",
    ]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
    ]

    fieldsets = (
        ("Account", {
            "fields": (
                "id",
                "email",
                "password",
            )
        }),
        ("Personal Information", {
            "fields": (
                "first_name",
                "last_name",
                "phone",
            )
        }),
        ("Permissions", {
            "fields": (
                "is_admin",
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),
        ("Dates", {
            "fields": (
                "created_at",
                "updated_at",
            )
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email",
                "first_name",
                "last_name",
                "phone",
                "password1",
                "password2",
                "is_admin",
                "is_active",
                "is_staff",
            ),
        }),
    )