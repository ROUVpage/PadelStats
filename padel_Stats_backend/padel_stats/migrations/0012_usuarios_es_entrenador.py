# Generated manually: add es_entrenador to Usuarios
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('padel_stats', '0011_datoksia_consejos_tecnicos'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuarios',
            name='es_entrenador',
            field=models.BooleanField(default=False),
        ),
    ]
