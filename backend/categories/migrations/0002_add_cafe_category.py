from django.db import migrations


def add_cafe_category(apps, schema_editor):
    BusinessCategory = apps.get_model("categories", "BusinessCategory")
    BusinessCategory.objects.get_or_create(
        name="Cafe",
        defaults={
            "description": "Coffee shops and cafes.",
            "is_active": True,
        },
    )


def remove_cafe_category(apps, schema_editor):
    BusinessCategory = apps.get_model("categories", "BusinessCategory")
    BusinessCategory.objects.filter(name="Cafe").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_cafe_category, remove_cafe_category),
    ]