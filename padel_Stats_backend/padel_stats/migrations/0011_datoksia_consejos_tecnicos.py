# Generated manually: add consejosTecnicos and erroresComunes to datosIA
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('padel_stats', '0010_rename_velocidadpelota_datosia_velocidadbola_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='datosia',
            name='consejosTecnicos',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='datosia',
            name='erroresComunes',
            field=models.JSONField(default=list),
        ),
    ]
