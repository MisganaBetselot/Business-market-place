from django.contrib import admin

from .models import BusinessCategory


@admin.register(BusinessCategory)
class BusinessCategoryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "description",
    ]

    search_fields = [
        "name",
    ]