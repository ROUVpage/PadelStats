# Testing Guide: Consejo Error (10th Output) Integration

## Pre-Flight Checklist

- [ ] Run `python manage.py migrate` (apply 0012_usuarios_es_entrenador.py)
- [ ] Verify `modelo_padel_cnn.h5` file exists or will be created on first training
- [ ] Ensure `scaler_padel.joblib` is in backend directory (created on first training)
- [ ] Check that all modified Python files have no syntax errors
- [ ] Verify frontend has latest IniciarSesion.js changes

## Unit Tests

### Test 1: Model Architecture
**Purpose**: Verify model has 10 output heads with correct names

```python
from padel_stats.cnn_model import crear_modelo_cnn
model = crear_modelo_cnn()
print([layer.name for layer in model.layers if 'dense' in layer.name.lower()])
# Should include: tipo_golpe, precision, potencia, efecto, velocidadBola, exigenciaFisica, puntoImpacto, tecnica, posibilidadLesion, consejo_error
```

### Test 2: Training with 10 Outputs
**Purpose**: Verify model can be trained with consejo_error label

```python
import numpy as np
from padel_stats.cnn_model import entrenar_o_cargar_modelo

# Create dummy batch
X = np.random.randn(1, 50, 10).astype(float)
y = {
    'tipo_golpe': np.array([[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], dtype=float),
    'precision': np.array([[7.0]], dtype=float),
    'potencia': np.array([[8.0]], dtype=float),
    'efecto': np.array([[0, 1, 0]], dtype=float),
    'velocidadBola': np.array([[85.5]], dtype=float),
    'exigenciaFisica': np.array([[6.0]], dtype=float),
    'puntoImpacto': np.array([[3.0]], dtype=float),
    'tecnica': np.array([[7.0]], dtype=float),
    'posibilidadLesion': np.array([[2.0]], dtype=float),
    'consejo_error': np.array([[0, 0, 0, 1, 0, 0, 0]], dtype=float)  # 10th output
}

model = entrenar_o_cargar_modelo({'X': X, 'y': y}, epochs_nuevo=1)
print("✓ Model trained successfully with consejo_error")
```

### Test 3: Inference with 10 Outputs
**Purpose**: Verify inference returns consejo_error prediction

```python
import numpy as np
from padel_stats.cnn_model import predecir_secuencia

# Create dummy sensor data
X = np.random.randn(1, 50, 10).astype(float)

predictions = predecir_secuencia(X)
print("Prediction keys:", list(predictions.keys()))
print("consejo_error shape:", predictions['consejo_error'].shape)  # Should be (1, 7)
print("consejo_error values:", predictions['consejo_error'][0])
print("consejo_error argmax:", np.argmax(predictions['consejo_error'][0]))
```

## API Tests (Using cURL or Postman)

### Test 4: POST /entrenar-golpe/ with consejo_error_idx

**Request**:
```bash
curl -X POST http://127.0.0.1:8000/datos/api/entrenar-golpe/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "X": [
      [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      ...repeated 50 times...
    ],
    "y": {
      "tipo_golpe": 0,
      "precision": 7,
      "potencia": 8,
      "efecto": 1,
      "velocidadBola": 85.5,
      "exigenciaFisica": 6,
      "puntoImpacto": 3,
      "tecnica": 7,
      "posibilidadLesion": 2
    },
    "consejo_error_idx": 3
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "mensaje": "Golpe entrenado con 10 salidas (9 metrics + consejo_error)",
  "tipo_golpe": "Bandeja",
  "consejo_error_idx": 3
}
```

### Test 5: POST /predecir-golpe-ia/ for Inference

**Request**:
```bash
curl -X POST http://127.0.0.1:8000/datos/api/predecir-golpe-ia/ \
  -H "Content-Type: application/json" \
  -d '{
    "X": [
      [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      ...repeated 50 times...
    ]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "tipo_golpe_idx": 0,
  "tipo_golpe": "Bandeja",
  "precision": 7.234,
  "potencia": 8.123,
  "efecto_idx": 1,
  "velocidadBola": 85.456,
  "exigenciaFisica": 6.789,
  "puntoImpacto": 3.456,
  "tecnica": 7.890,
  "posibilidadLesion": 2.345,
  "consejo_error_idx": 3,
  "consejo_error": "Transferencia de peso débil"
}
```

### Test 6: GET /catalogo-consejos/ for Catalog

**Request**:
```bash
curl -X GET http://127.0.0.1:8000/datos/api/catalogo-consejos/
```

**Expected Response**: Full catalog of error/advice texts indexed by stroke type

## Frontend Tests

### Test 7: Trainer Mode - Select consejo_error

1. Log in as a trainer (es_entrenador = True)
2. Navigate to IniciarSesion screen
3. Verify Picker for consejo_error shows 7 options:
   - "Punto de impacto tardío"
   - "Armado incompleto"
   - "Terminado inestable"
   - "Transferencia de peso débil"
   - "Recuperación lenta"
   - "Carga excesiva en muñeca/hombro"
   - "Base sólida"
4. Select different error and verify selection updates UI

### Test 8: Trainer Mode - Send Training Golpe

1. Select stroke type (e.g., "Bandeja")
2. Set all 9 metrics (precision, potencia, efecto, etc.)
3. Select consejo_error from picker (e.g., "Transferencia de peso débil" = index 3)
4. Press "Entrenar" button
5. Verify success alert shows: "Golpe entrenado con 10 salidas (9 metrics + consejo_error)"
6. Check backend logs for training completion

### Test 9: Inference - Predict consejo_error

1. After training at least one golpe with consejo_error
2. In session, capture a real golpe (or simulate)
3. Send to model for prediction
4. Verify response includes consejo_error_idx and mapped error text
5. Display prediction in UI with error/advice text

## Data Validation Tests

### Test 10: consejo_error_idx Validation

**Valid inputs**: 0, 1, 2, 3, 4, 5, 6
**Invalid inputs**: -1, 7, 8, "invalid", null

**Expected behavior**:
- Valid: Request succeeds, model trains with one-hot tensor
- Invalid: Returns 400 error with message "consejo_error_idx debe ser índice 0-6"

### Test 11: Missing consejo_error_idx

**Request without consejo_error_idx field**:
```json
{
  "user_id": 1,
  "X": [...],
  "y": {...},
  "consejo_error_idx": null
}
```

**Expected Response**: 400 error: "consejo_error_idx debe ser índice 0-6"

## Integration Tests

### Test 12: Full Training → Inference Loop

1. Train model with 3-5 sample golpes, each with different consejo_error_idx
2. Save model
3. Load model
4. Predict on new sample data
5. Verify inference returns argmax indices that are in range [0-6]
6. Verify catalog lookup works and returns non-empty error text

### Test 13: Error Catalog Context

1. Train golpe as "Bandeja" with consejo_error_idx=0 ("Punto de impacto tardío")
2. Predict on similar data
3. Verify returned consejo_error text matches catalog entry for Bandeja + error_0
4. If catalog entry missing, verify fallback text returned

## Performance Tests

### Test 14: Model Size and Inference Time

- Verify model file size (should be reasonable, < 50MB)
- Measure inference time for single golpe: should be < 500ms
- Measure training time for one golpe: should be < 5 seconds

## Common Issues & Fixes

### Issue 1: "consejo_error" layer not found during prediction
**Fix**: Verify model was created with `crear_modelo_cnn()` and has 10 output layers

### Issue 2: Shape mismatch in y['consejo_error']
**Fix**: Ensure consejo_error is shape (batch, 7) one-hot tensor, not (batch, 1)

### Issue 3: consejo_error_idx out of range
**Fix**: Validate index is 0-6, frontend needs to map string to index before sending

### Issue 4: Model not learning consejo_error
**Fix**: Verify loss dict includes 'consejo_error' and model is recompiled after changes

### Issue 5: Inference returns wrong error
**Fix**: Check catalog indexing, verify argmax is correctly mapping to error text

## Sign-Off Checklist

- [ ] Model trains successfully with consejo_error
- [ ] Inference returns all 10 outputs
- [ ] Frontend sends consejo_error_idx correctly
- [ ] Backend endpoint validates consejo_error_idx
- [ ] Catalog lookup works and returns error text
- [ ] Error frequencies can be calculated at session end
- [ ] Predictions displayed in UI with error advice
- [ ] Trainer mode fully functional
- [ ] No console errors or warnings
- [ ] Database migration applied (es_entrenador field exists)
