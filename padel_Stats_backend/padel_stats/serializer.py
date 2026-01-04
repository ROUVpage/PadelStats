from .models import datosEntrenar, datosIA, sesiones, Usuarios, SecuenciaGolpe, datosSensor
from rest_framework import serializers

class datosSerializer(serializers.ModelSerializer):
    class Meta:
        model = datosEntrenar
        fields = "__all__"

class sesionesSerializer(serializers.ModelSerializer):
    class Meta:
        model = sesiones
        fields = "__all__"

class datosIASerializer(serializers.ModelSerializer):
    class Meta:
        model = datosIA
        fields = "__all__"

class usuariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuarios
        fields = "__all__"

class SecuenciaGolpeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecuenciaGolpe
        fields = '__all__'

class datosSensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = datosSensor
        fields = "__all__"