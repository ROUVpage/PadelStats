from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.
class datosEntrenar(models.Model):
    roll = models.FloatField(default=0.0)
    pitch = models.FloatField(default=0.0)
    yaw = models.FloatField(default=0.0)
    DistanciaFrontal = models.FloatField(default=0.0)
    DitanciaLateral = models.FloatField(default=0.0)
    DitanciaInferior = models.FloatField(default=0.0)
    AceleraciónX = models.FloatField(default=0.0)
    AceleraciónY = models.FloatField(default=0.0)
    AceleraciónZ = models.FloatField(default=0.0)
    VelodidadPala = models.FloatField(default=0.0)
    DirrecciónGolpe = models.FloatField(default=0.0)
    AlturaRed = models.FloatField(default=0.0)
    VelocidadPelota = models.FloatField(default=0.0)
    altura = models.IntegerField(default=0)
    peso = models.IntegerField(default=0)
    manoDominante = models.BooleanField(default=False)
    tipo = models.TextField(default='')
    errorNoForzado = models.BooleanField(default=False)
    calidad = models.FloatField(default=5.0)  

class datosSensor(models.Model):
    roll = models.JSONField(default=list)
    pitch = models.JSONField(default=list)
    yaw = models.JSONField(default=list)
    DistanciaFrontal = models.JSONField(default=list)
    DitanciaLateral = models.JSONField(default=list)
    DitanciaInferior = models.JSONField(default=list)
    AceleraciónX = models.JSONField(default=list)
    AceleraciónY = models.JSONField(default=list)
    AceleraciónZ = models.JSONField(default=list)
    VelodidadPala = models.JSONField(default=list)
    DirrecciónGolpe = models.JSONField(default=list)
    AlturaRed = models.JSONField(default=list)
    VelocidadPelota = models.JSONField(default=list)
    altura = models.IntegerField(default=0)
    peso = models.IntegerField(default=0)
    sesionId = models.IntegerField(default=0)

class sesiones(models.Model):
    duracion = models.IntegerField(default=0)
    calidadMedia = models.FloatField(default=0.0)
    fecha = models.DateTimeField(default=timezone.now)
    numGolpes = models.IntegerField(default=0)
    erroresforzados = models.FloatField(default=0.0)
    
    # Mejor golpe - características generales
    mejorGolpe = models.CharField(max_length=255, default='')
    mejorGolpeCalidad = models.FloatField(default=0.0)
    mejorGolpeTecnica = models.FloatField(default=0.0)
    mejorGolpePrecision = models.FloatField(default=0.0)
    mejorGolpePotencia = models.FloatField(default=0.0)
    mejorGolpePuntoImpacto = models.FloatField(default=0.0)
    
    # Peor golpe - características generales
    peorGolpe = models.CharField(max_length=255, default='')
    peorGolpeCalidad = models.FloatField(default=0.0)
    peorGolpeTecnica = models.FloatField(default=0.0)
    peorGolpePrecision = models.FloatField(default=0.0)
    peorGolpePotencia = models.FloatField(default=0.0)
    peorGolpePuntoImpacto = models.FloatField(default=0.0)
    
    # Estadísticas generales de la sesión
    exigenciaFisicaMedia = models.FloatField(default=0.0)
    velocidadBolaMaxima = models.FloatField(default=0.0)
    posibilidadLesionMedia = models.FloatField(default=0.0)
    
    idUsuario = models.IntegerField(default=0)

class Usuarios(models.Model):
    device_id = models.CharField(max_length=255, default='')
    device_id2 = models.CharField(max_length=255, default='')
    nombre = models.TextField(default='')
    altura = models.FloatField(default=0.0)
    peso = models.FloatField(default=0.0)
    contraseña = models.TextField(default='')
    manoDominanate = models.BooleanField(default=False)
    img = models.ImageField(upload_to='images/', null=True, blank=True)
    fechaCreacion = models.DateTimeField(auto_now_add=True)
    es_entrenador = models.BooleanField(default=False)

class datosIA(models.Model):
    # Campos de predicción de IA requeridos
    tipo = models.TextField(default='')  # tipo de golpe
    precision = models.IntegerField(default=5)  # 1-10
    potencia = models.IntegerField(default=5)  # 1-10
    efecto = models.CharField(max_length=20, default='plano')  # plano, cortado, liftado
    velocidadBola = models.FloatField(default=0.0)  # km/h
    exigenciaFisica = models.IntegerField(default=5)  # 1-10
    puntoImpacto = models.IntegerField(default=3)  # 1-5
    tecnica = models.IntegerField(default=5)  # 1-10
    posibilidadLesion = models.IntegerField(default=1)  # 1-5
    
    # Campos de sesión
    idSesión = models.IntegerField(default=0)
    tiempo = models.TimeField(default=timezone.now)

    # Consejos y errores técnicos por golpe
    consejosTecnicos = models.JSONField(default=list)  # [{"error": str, "nivel": str, "consejo": str}]
    erroresComunes = models.JSONField(default=list)  # lista de etiquetas resumidas con el mismo formato

class SecuenciaGolpe(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    roll = models.FloatField()
    pitch = models.FloatField()
    yaw = models.FloatField()
    AceleraciónX = models.FloatField()
    AceleraciónY = models.FloatField()
    AceleraciónZ = models.FloatField()
    VelocidadPala = models.FloatField()
    DistanciaFrontal = models.FloatField()
    DistanciaLateral = models.FloatField()
    DistanciaInferior = models.FloatField()
    AlturaRed = models.FloatField(default=0.0)
    DirecciónGolpe = models.FloatField(default=0.0)
    VelocidadPelota = models.FloatField(default=0.0)
    tipo_golpe = models.CharField(max_length=50, null=True)
    errorNoForzado = models.BooleanField(null=True)
    calidad = models.FloatField(null=True)
    
    class Meta:
        ordering = ['timestamp']