from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0002_savedlisting"),
    ]

    operations = [
        migrations.AddField(
            model_name="businesslisting",
            name="views",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
