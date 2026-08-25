from django.contrib import admin

from .models import BusinessCategory


@admin.register(BusinessCategory)
class BusinessCategoryAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "parent",
        "is_active",
        "created_at",
    ]

    search_fields = [
        "name",
        "description",
    ]

    list_filter = [
        "is_active",
        "parent",
        "created_at",
    ]

    ordering = ["name"]