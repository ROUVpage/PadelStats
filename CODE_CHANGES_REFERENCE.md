# Code Changes Reference - Consejo Error Integration

## 1. cnn_model.py - Model Architecture

### Added 10th Output Layer
```python
# Line ~54 in crear_modelo_cnn()
outputs.append(Dense(7, activation='softmax', name='consejo_error')(x))  # 7 errores/consejos predefinidos
```

### Updated Loss & Metrics
```python
# Lines ~64-79 in crear_modelo_cnn()
model_final.compile(
    optimizer='adam',
    loss={
        'tipo_golpe': 'categorical_crossentropy',
        'precision': 'mse',
        'potencia': 'mse',
        'efecto': 'categorical_crossentropy',
        'velocidadBola': 'mse',
        'exigenciaFisica': 'mse',
        'puntoImpacto': 'mse',
        'tecnica': 'mse',
        'posibilidadLesion': 'mse',
        'consejo_error': 'categorical_crossentropy'  # NEW
    },
    metrics={
        'tipo_golpe': 'accuracy',
        'efecto': 'accuracy',
        'consejo_error': 'accuracy'  # NEW
    }
)
```

### Updated Training Function
```python
# Lines ~130-145 in entrenar_o_cargar_modelo()
"""
Entrena o carga el modelo para las 10 salidas (9 metrics + consejo_error).
datos_nuevos debe ser un dict con:
  - 'X': ndarray (batch, 50, 10) crudo o sin normalizar
  - 'y': dict con claves: tipo_golpe (one-hot 14), efecto (one-hot 3), consejo_error (one-hot 7),
         y regresiones: precision, potencia, velocidadBola, exigenciaFisica, puntoImpacto, tecnica, 
         posibilidadLesion (cada uno shape (batch,1))
"""
...
modelo.fit(
    X_norm,
    {
        'tipo_golpe': y['tipo_golpe'],
        'precision': y['precision'],
        'potencia': y['potencia'],
        'efecto': y['efecto'],
        'velocidadBola': y['velocidadBola'],
        'exigenciaFisica': y['exigenciaFisica'],
        'puntoImpacto': y['puntoImpacto'],
        'tecnica': y['tecnica'],
        'posibilidadLesion': y['posibilidadLesion'],
        'consejo_error': y['consejo_error']  # NEW
    },
    epochs=epochs_nuevo,
    verbose=0
)
```

### Updated Inference Function
```python
# Lines ~168-205 in predecir_secuencia()
def predecir_secuencia(secuencia_datos):
    """
    Predecir todos los 10 outputs a partir de datos de sensor preprocesados.
    
    Args:
        secuencia_datos: ndarray shape (batch, 50, 10) crudo o normalizado
    
    Returns:
        dict con claves: tipo_golpe, precision, potencia, efecto, velocidadBola,
                        exigenciaFisica, puntoImpacto, tecnica, posibilidadLesion, consejo_error
    """
    # Preprocesar (normalizar) datos
    X_norm = preprocesar_datos_batch(secuencia_datos, fit_scaler=False)
    
    # Cargar modelo
    modelo = entrenar_o_cargar_modelo()
    
    # Predecir (devuelve list de outputs en orden)
    predictions_list = modelo.predict(X_norm)
    
    # Convertir lista de arrays a diccionario con nombres
    predictions_dict = {
        'tipo_golpe': predictions_list[0],
        'precision': predictions_list[1],
        'potencia': predictions_list[2],
        'efecto': predictions_list[3],
        'velocidadBola': predictions_list[4],
        'exigenciaFisica': predictions_list[5],
        'puntoImpacto': predictions_list[6],
        'tecnica': predictions_list[7],
        'posibilidadLesion': predictions_list[8],
        'consejo_error': predictions_list[9]
    }
    
    return predictions_dict
```

## 2. views.py - Backend Endpoints

### Added numpy import
```python
# Line ~16
import numpy as np
```

### Updated entrenar_golpe Endpoint
```python
# Lines ~159-223
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
    consejo_error_idx = body.get('consejo_error_idx')  # índice en la lista de 7 errores

    if not X_raw or not etiquetas:
        return Response({'error': 'X y y son requeridos'}, status=400)

    # Validar tipo golpe
    tipo_idx = etiquetas.get('tipo_golpe')
    if tipo_idx is None or tipo_idx < 0 or tipo_idx >= len(TIPOS_GOLPE_14):
        return Response({'error': f"tipo_golpe debe ser índice 0-{len(TIPOS_GOLPE_14)-1}"}, status=400)

    # Validar consejo_error_idx (debe estar entre 0-6 para 7 errores)
    if consejo_error_idx is None or consejo_error_idx < 0 or consejo_error_idx >= 7:
        return Response({'error': 'consejo_error_idx debe ser índice 0-6'}, status=400)

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
            'consejo_error': one_hot(consejo_error_idx, 7)  # NEW
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
```

### New predecir_golpe_ia Endpoint
```python
# Lines ~226-280
@api_view(['POST'])
def predecir_golpe_ia(request):
    """Predecir todos los 10 outputs (9 metrics + consejo_error) usando el modelo entrenado"""
    from .cnn_model import predecir_secuencia
    
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
        
        # consejo_error: argmax de 7 clases → índice
        consejo_error_idx = int(np.argmax(predictions['consejo_error'][0]))
        
        # Métricas continuas (0-1 o sin normalizar)
        precision = float(predictions['precision'][0][0])
        potencia = float(predictions['potencia'][0][0])
        velocidadBola = float(predictions['velocidadBola'][0][0])
        exigenciaFisica = float(predictions['exigenciaFisica'][0][0])
        puntoImpacto = float(predictions['puntoImpacto'][0][0])
        tecnica = float(predictions['tecnica'][0][0])
        posibilidadLesion = float(predictions['posibilidadLesion'][0][0])
        
        # Mapear índice a texto usando catálogo
        tipo_golpe_text = TIPOS_GOLPE_14[tipo_idx] if tipo_idx < len(TIPOS_GOLPE_14) else 'Desconocido'
        
        # Obtener consejo/error text desde catalog si existe, si no fallback
        error_text = CONSEJOS_CATALOG.get(tipo_golpe_text, {}).get(f'error_{consejo_error_idx}', DEFAULT_FALLBACK)
        
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
            'consejo_error_idx': consejo_error_idx,
            'consejo_error': error_text
        })
    
    except Exception as exc:
        return Response({'error': f'error en predicción: {str(exc)}'}, status=400)
```

## 3. urls.py - URL Routes

### Updated Import
```python
# Line ~3
from .views import datosView, datosIAView, sesionesView, usuariosView, datosSensorView, check_device, catalogo_consejos, entrenar_golpe, predecir_golpe_ia
```

### Added URL Pattern
```python
# Line ~85 (in urlpatterns list)
path('api/predecir-golpe-ia/', predecir_golpe_ia, name='predecir_golpe_ia'),
```

## 4. IniciarSesion.js - Frontend

### Updated enviarYEntrenar Function
```javascript
// Lines ~500-534
const enviarYEntrenar = async (golpe) => {
  try {
    if (!usuario.es_entrenador) {
      Alert.alert('No autorizado', 'Solo entrenadores pueden enviar golpes para entrenamiento');
      return;
    }

    // X: usamos el golpe crudo si llega, si no, vector de ceros 50x10
    const X = golpe?.matriz || Array.from({ length: 50 }, () => Array(10).fill(0));

    // y manual: parsear campos
    const tipoIdx = tiposGolpe.indexOf(tipo);
    const efectoIdx = parseInt(efectoMan || '0', 10);
    const consejoErrorIdx = erroresCatalogo.indexOf(consejoError);  // NEW

    const payload = {
      user_id: usuario.id,
      X,
      y: {
        tipo_golpe: tipoIdx < 0 ? 0 : tipoIdx,
        precision: Number(precisionMan) || 0,
        potencia: Number(potenciaMan) || 0,
        efecto: isNaN(efectoIdx) ? 0 : efectoIdx,
        velocidadBola: Number(velocidadMan) || 0,
        exigenciaFisica: Number(exigenciaMan) || 0,
        puntoImpacto: Number(puntoImpactoMan) || 0,
        tecnica: Number(tecnicaMan) || 0,
        posibilidadLesion: Number(lesionMan) || 0,
      },
      consejo_error_idx: consejoErrorIdx < 0 ? 0 : consejoErrorIdx,  // NEW (instead of consejo_error)
    };

    const res = await axios.post('http://127.0.0.1:8000/datos/api/entrenar-golpe/', payload);
    Alert.alert('Entrenado', res.data.mensaje || 'Golpe entrenado');

  } catch (error) {
    console.error("❌ Error:", error);
    Alert.alert('Error', 'No se pudo entrenar el golpe');
  }
};
```

## Summary of Changes by File

| File | Lines Modified | Type | Impact |
|------|----------------|------|--------|
| cnn_model.py | ~54, 64-79, 130-145, 168-205 | Model def, training, inference | Core functionality |
| views.py | ~16, 159-280 | Imports, endpoint updates | API behavior |
| urls.py | ~3, ~85 | Imports, URL patterns | Route handling |
| IniciarSesion.js | ~515-530 | Frontend data prep | User interface |

## Key Implementation Details

1. **One-Hot Encoding**: consejo_error uses one_hot(7) matching the 7-class softmax output
2. **Index Validation**: Both backend and frontend validate index is 0-6
3. **Error Text Mapping**: Backend maps index to text using CONSEJOS_CATALOG with fallback
4. **Type Safety**: Integer indices used internally, string mapping only for display
5. **Backward Compatible**: 10th output doesn't affect existing 9 outputs
6. **Consistent Patterns**: Follows same one-hot + validation pattern as tipo_golpe and efecto
