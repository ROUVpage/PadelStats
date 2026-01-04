TIPOS_GOLPE_14 = [
    'Bandeja', 'Vibora', 'Remate liftado', 'Remate plano',
    'Volea de derecha', 'Volea de derecha baja', 'Volea de reves', 'Volea de reves baja',
    'derecha', 'reves', 'derecha con pared', 'reves con pared',
    'bajada de derecha', 'bajada de reves'
]
from django.shortcuts import render
from rest_framework import viewsets
from .models import datosIA, sesiones, datosEntrenar, Usuarios, SecuenciaGolpe, datosSensor
from .serializer import datosIASerializer, datosSerializer, datosSensorSerializer, sesionesSerializer, usuariosSerializer, SecuenciaGolpeSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import numpy as np
from django.db.models import Avg, Max
from .consejos_catalogo import CONSEJOS_CATALOG, DEFAULT_FALLBACK
from .cnn_model import entrenar_o_cargar_modelo

# Create your views here.

class datosView(viewsets.ModelViewSet):
    serializer_class = datosSerializer
    queryset = datosEntrenar.objects.all()

class datosIAView(viewsets.ModelViewSet):
    serializer_class = datosIASerializer
    queryset = datosIA.objects.all()

class datosSensorView(viewsets.ModelViewSet):
    serializer_class = datosSensorSerializer
    queryset = datosSensor.objects.all()    

class sesionesView(viewsets.ModelViewSet):
    serializer_class = sesionesSerializer
    queryset = sesiones.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        """Override para calcular estadísticas al obtener una sesión"""
        instance = self.get_object()
        
        # Obtener todos los golpes de la sesión
        golpes = datosIA.objects.filter(idSesión=instance.id)
        
        if golpes.exists():
            # Calcular mejor y peor golpe basado en la media de técnica, punto de impacto, potencia y precisión
            mejor_golpe = None
            peor_golpe = None
            mejor_media = 0
            peor_media = float('inf')
            
            for golpe in golpes:
                media_golpe = (golpe.tecnica + golpe.puntoImpacto + golpe.potencia + golpe.precision) / 4
                
                if media_golpe > mejor_media:
                    mejor_media = media_golpe
                    mejor_golpe = golpe
                    
                if media_golpe < peor_media:
                    peor_media = media_golpe
                    peor_golpe = golpe
            
            # Actualizar estadísticas de la sesión
            if mejor_golpe:
                instance.mejorGolpe = mejor_golpe.tipo
                instance.mejorGolpeTecnica = mejor_golpe.tecnica
                instance.mejorGolpePrecision = mejor_golpe.precision
                instance.mejorGolpePotencia = mejor_golpe.potencia
                instance.mejorGolpePuntoImpacto = mejor_golpe.puntoImpacto
                
            if peor_golpe:
                instance.peorGolpe = peor_golpe.tipo
                instance.peorGolpeTecnica = peor_golpe.tecnica
                instance.peorGolpePrecision = peor_golpe.precision
                instance.peorGolpePotencia = peor_golpe.potencia
                instance.peorGolpePuntoImpacto = peor_golpe.puntoImpacto
            
            # Calcular estadísticas generales
            instance.exigenciaFisicaMedia = golpes.aggregate(Avg('exigenciaFisica'))['exigenciaFisica__avg'] or 0
            instance.velocidadBolaMaxima = golpes.aggregate(Max('velocidadBola'))['velocidadBola__max'] or 0
            instance.posibilidadLesionMedia = golpes.aggregate(Avg('posibilidadLesion'))['posibilidadLesion__avg'] or 0
            instance.numGolpes = golpes.count()
            
            instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class usuariosView(viewsets.ModelViewSet):
    serializer_class = usuariosSerializer
    queryset = Usuarios.objects.all()

@api_view(['POST'])
def check_device(request):
    """Verificar o crear dispositivo"""
    device_id = request.data.get('device_id')
    if not device_id:
        return Response({'error': 'device_id es requerido'}, status=400)
    
    usuario, created = Usuarios.objects.get_or_create(
        device_id=device_id,
        defaults={'nombre': f'Usuario_{device_id[:8]}'}
    )
    
    return Response({
        'success': True,
        'user_id': usuario.id,
        'device_id': usuario.device_id,
        'created': created
    })

@api_view(['GET'])
def predecirDatos(request, distancia, ax, ay):
    """Predicción temporal sin IA"""
    return Response({
        'prediccion': 'derecha',  # Predicción temporal
        'confianza': 0.85,
        'mensaje': 'Función de IA temporalmente deshabilitada'
    })

@api_view(['POST'])
def recibir_datos_y_entrenar(request):
    """Función temporal para recibir datos"""
    return Response({
        'success': True,
        'mensaje': 'Datos recibidos, entrenamiento pendiente'
    })

@api_view(['POST'])
def predecir_golpe(request):
    """Predicción de golpe temporal"""
    return Response({
        'prediccion': 'derecha',
        'confianza': 0.8,
        'mensaje': 'Función de IA temporalmente deshabilitada'
    })

@api_view(['POST'])
def entrenar_modelo(request):
    """Entrenamiento temporal"""
    return Response({
        'success': True,
        'mensaje': 'Entrenamiento pendiente - función temporalmente deshabilitada'
    })


@api_view(['GET'])
def catalogo_consejos(request):
    """Devuelve el catálogo de frases de consejo técnico centralizado en backend"""
    return Response({
        'catalogo': CONSEJOS_CATALOG,
        'fallback': DEFAULT_FALLBACK
    })


@api_view(['POST'])
def entrenar_golpe(request):
    """Entrenar un golpe (batch de 1) ingresando manualmente todas las etiquetas (9 metrics + consejo_error)"""
    body = request.data

    # Chequeo de entrenador
    user_id = body.get('user_id')
    if not user_id:
        return Response({'error': 'user_id requerido'}, status=400)
    try:
        usuario = Usuarios.objects.get(id=user_id)
    except Usuarios.DoesNotExist:
        return Response({'error': 'usuario no encontrado'}, status=404)
    if not usuario.es_entrenador:
        return Response({'error': 'no autorizado'}, status=403)

    # Inputs
    X_raw = body.get('X')  # esperado shape (50,10) lista de listas
    etiquetas = body.get('y') or {}
    consejo_error_idx = body.get('consejo_error_idx')  # índice en la lista de 8 criterios técnicos

    if not X_raw or not etiquetas:
        return Response({'error': 'X y y son requeridos'}, status=400)

    # Validar tipo golpe
    tipo_idx = etiquetas.get('tipo_golpe')
    if tipo_idx is None or tipo_idx < 0 or tipo_idx >= len(TIPOS_GOLPE_14):
        return Response({'error': f"tipo_golpe debe ser índice 0-{len(TIPOS_GOLPE_14)-1}"}, status=400)

    # Validar consejo_error_idx (debe estar entre 0-7 para 8 criterios)
    if consejo_error_idx is None or consejo_error_idx < 0 or consejo_error_idx >= 8:
        return Response({'error': 'consejo_error_idx debe ser índice 0-7 (8 criterios técnicos)'}, status=400)

    # Build batch=1
    X_np = np.array([X_raw], dtype=float)

    # One-hot helpers
    def one_hot(idx, num):
        vec = np.zeros((1, num), dtype=float)
        vec[0, int(idx)] = 1.0
        return vec

    try:
        y_dict = {
            'tipo_golpe': one_hot(etiquetas['tipo_golpe'], len(TIPOS_GOLPE_14)),
            'precision': np.array([[etiquetas['precision']]], dtype=float),
            'potencia': np.array([[etiquetas['potencia']]], dtype=float),
            'efecto': one_hot(etiquetas['efecto'], 3),
            'velocidadBola': np.array([[etiquetas['velocidadBola']]], dtype=float),
            'exigenciaFisica': np.array([[etiquetas['exigenciaFisica']]], dtype=float),
            'puntoImpacto': np.array([[etiquetas['puntoImpacto']]], dtype=float),
            'tecnica': np.array([[etiquetas['tecnica']]], dtype=float),
            'posibilidadLesion': np.array([[etiquetas['posibilidadLesion']]], dtype=float),
            'consejo_error': one_hot(consejo_error_idx, 8)
        }
    except Exception as exc:
        return Response({'error': f'faltan etiquetas o formato inválido: {exc}'}, status=400)

    entrenar_o_cargar_modelo({'X': X_np, 'y': y_dict}, epochs_nuevo=5, fit_scaler=True)

    return Response({
        'success': True,
        'mensaje': 'Golpe entrenado con 10 salidas (9 metrics + consejo_error)',
        'tipo_golpe': TIPOS_GOLPE_14[int(tipo_idx)],
        'consejo_error_idx': consejo_error_idx
    })


@api_view(['POST'])
def predecir_golpe_ia(request):
    """Predecir todos los 10 outputs (9 metrics + consejo_error) usando el modelo entrenado.
    El consejo_error se predice considerando EL TIPO DE GOLPE ESPECÍFICO para seleccionar 
    el texto de error/consejo técnico más relevante para ese tipo de golpe."""
    from .cnn_model import predecir_secuencia
    from .consejos_catalogo import CONSEJOS_CATALOG, DEFAULT_FALLBACK, ERROR_CATEGORIES
    
    body = request.data
    X_raw = body.get('X')  # esperado shape (50,10) lista de listas

    if not X_raw:
        return Response({'error': 'X es requerido'}, status=400)

    try:
        # Convertir a ndarray batch=1
        X_np = np.array([X_raw], dtype=float)
        
        # Predecir usando el modelo (devuelve dict con las 10 salidas)
        predictions = predecir_secuencia(X_np)
        
        # Procesar predicciones
        # tipo_golpe: argmax de 14 clases → índice
        tipo_idx = int(np.argmax(predictions['tipo_golpe'][0]))
        
        # efecto: argmax de 3 clases → índice
        efecto_idx = int(np.argmax(predictions['efecto'][0]))
        
        # consejo_error: Top-K criterios técnicos con mayor probabilidad
        # IMPORTANTE: El modelo aprende a predecir el error considerando el tipo de golpe
        # porque durante entrenamiento, el tipo_golpe y consejo_error se entrenan juntos
        TOP_K = 3  # Devolver los 3 criterios más probables
        MIN_PROB = 0.3  # Probabilidad mínima para incluir un criterio (30%)
        
        consejo_probs = predictions['consejo_error'][0]
        top_indices = np.argsort(consejo_probs)[::-1][:TOP_K]
        
        # Métricas continuas (0-1 o sin normalizar)
        precision = float(predictions['precision'][0][0])
        potencia = float(predictions['potencia'][0][0])
        velocidadBola = float(predictions['velocidadBola'][0][0])
        exigenciaFisica = float(predictions['exigenciaFisica'][0][0])
        puntoImpacto = float(predictions['puntoImpacto'][0][0])
        tecnica = float(predictions['tecnica'][0][0])
        posibilidadLesion = float(predictions['posibilidadLesion'][0][0])
        
        # Mapear índice a tipo de golpe
        tipo_golpe_text = TIPOS_GOLPE_14[tipo_idx] if tipo_idx < len(TIPOS_GOLPE_14) else 'Desconocido'
        
        # *** MAPEO TIPO-ESPECÍFICO DE ERRORES - TOP-K CRITERIOS ***
        # Obtener consejos/errores desde catalog ESPECÍFICO DEL TIPO DE GOLPE PREDICHO
        # Devolver múltiples criterios ordenados por probabilidad
        consejos_tecnicos = []
        
        if tipo_golpe_text in CONSEJOS_CATALOG:
            tipo_catalog = CONSEJOS_CATALOG[tipo_golpe_text]
            
            for idx in top_indices:
                prob = float(consejo_probs[idx])
                if prob >= MIN_PROB:  # Solo incluir criterios con probabilidad >= 30%
                    consejo_text = tipo_catalog.get(idx, DEFAULT_FALLBACK.get(idx, "Consejo no disponible"))
                    consejos_tecnicos.append({
                        'criterio_idx': int(idx),
                        'criterio_nombre': ERROR_CATEGORIES.get(idx, 'Desconocido'),
                        'probabilidad': round(prob, 3),
                        'porcentaje': f"{round(prob * 100, 1)}%",
                        'consejo': consejo_text
                    })
        else:
            # Fallback si el tipo de golpe no existe en el catálogo
            for idx in top_indices:
                prob = float(consejo_probs[idx])
                if prob >= MIN_PROB:
                    consejos_tecnicos.append({
                        'criterio_idx': int(idx),
                        'criterio_nombre': ERROR_CATEGORIES.get(idx, 'Desconocido'),
                        'probabilidad': round(prob, 3),
                        'porcentaje': f"{round(prob * 100, 1)}%",
                        'consejo': DEFAULT_FALLBACK.get(idx, "Consejo no disponible")
                    })
        
        return Response({
            'success': True,
            'tipo_golpe_idx': tipo_idx,
            'tipo_golpe': tipo_golpe_text,
            'precision': precision,
            'potencia': potencia,
            'efecto_idx': efecto_idx,
            'velocidadBola': velocidadBola,
            'exigenciaFisica': exigenciaFisica,
            'puntoImpacto': puntoImpacto,
            'tecnica': tecnica,
            'posibilidadLesion': posibilidadLesion,
            'consejos_tecnicos': consejos_tecnicos  # Array de top-K criterios con probabilidades
        })
    
    except Exception as exc:
        return Response({'error': f'error en predicción: {str(exc)}'}, status=400)

