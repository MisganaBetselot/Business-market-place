from django.contrib import admin

from .models import BusinessListing


@admin.register(BusinessListing)
class BusinessListingAdmin(admin.ModelAdmin):
    list_display = [
        "business_name",
        "seller",
        "category",
        "asking_price",
        "city",
        "region",
        "status",
        "created_at",
    ]

    search_fields = [
        "business_name",
        "description",
        "seller__email",
        "city",
        "region",
    ]

    list_filter = [
        "status",
        "category",
        "region",
        "city",
        "created_at",
    ]

    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
    ]

    ordering = ["-created_at"]