# Consejo Error (10th Output) Integration Summary

## Overview
Successfully integrated the 10th model output (`consejo_error`) to predict error/advice categories for each stroke. The IA now predicts 7 error/advice classes (one per stroke mistake or technique issue), enabling context-aware feedback based on stroke type and sensor data.

## Architecture Changes

### 1. **Model Architecture (cnn_model.py)**
- **Added 10th Output Head**: Dense(7, 'softmax', 'consejo_error')
  - Predicts 7 error/advice categories
  - Uses softmax activation for multi-class classification
- **Updated Loss Function**: Added 'consejo_error': 'categorical_crossentropy'
- **Updated Metrics**: Added 'consejo_error': 'accuracy'
- **Training Function Signature**: Updated to accept y['consejo_error'] as one-hot(7)

### 2. **Backend Endpoints**

#### Updated Endpoint: `POST /datos/api/entrenar-golpe/`
- **Purpose**: Train model on manually labeled golpe (batch=1)
- **New Parameter**: `consejo_error_idx` (0-6) - index of selected error
- **Changes**:
  - Validates `consejo_error_idx` is in range [0, 6]
  - Builds one-hot(7) tensor for consejo_error
  - Includes it in y_dict for model.fit()
  - Returns response with consejo_error_idx confirmation

**Request Format**:
```json
{
  "user_id": 1,
  "X": [[...50x10 sensor data...]],
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
}
```

#### New Endpoint: `POST /datos/api/predecir-golpe-ia/`
- **Purpose**: Inference endpoint - predict all 10 outputs using trained model
- **Input**: X (batch=1, 50x10 sensor data)
- **Output**: All 10 predictions including consejo_error_idx and mapped error text
- **Features**:
  - Normalizes input using shared scaler
  - Returns argmax indices for categorical outputs
  - Maps consejo_error to text using backend catalog (with fallback)
  - Returns all 9 metrics + consejo_error_idx + consejo_error text

**Request Format**:
```json
{
  "X": [[...50x10 sensor data...]]
}
```

**Response Format**:
```json
{
  "success": true,
  "tipo_golpe_idx": 0,
  "tipo_golpe": "Bandeja",
  "precision": 7.5,
  "potencia": 8.2,
  "efecto_idx": 1,
  "velocidadBola": 85.5,
  "exigenciaFisica": 6.1,
  "puntoImpacto": 3.2,
  "tecnica": 7.8,
  "posibilidadLesion": 2.1,
  "consejo_error_idx": 3,
  "consejo_error": "Recuperación lenta"
}
```

### 3. **Frontend Changes (IniciarSesion.js)**

#### Updated Function: `enviarYEntrenar(golpe)`
- **Changes**:
  - Maps consejo_error (string) to index in erroresCatalogo array
  - Sends `consejo_error_idx` (number 0-6) instead of consejo_error (string)
  - Validates index is in valid range before sending

**Error Catalog (7 options)**:
```javascript
const erroresCatalogo = [
  'Punto de impacto tardío',      // 0
  'Armado incompleto',             // 1
  'Terminado inestable',           // 2
  'Transferencia de peso débil',   // 3
  'Recuperación lenta',            // 4
  'Carga excesiva en muñeca/hombro', // 5
  'Base sólida'                    // 6
];
```

#### Consejo Error Selection
- **Picker Component**: User selects from 7 error/advice options
- **UI Integration**: Placed alongside other manual input fields for trainer mode
- **Validation**: Index automatically bounds-checked (defaults to 0 if invalid)

### 4. **Model Output Order (Critical)**
```
predictions_list[0] → tipo_golpe (14 classes)
predictions_list[1] → precision (float)
predictions_list[2] → potencia (float)
predictions_list[3] → efecto (3 classes)
predictions_list[4] → velocidadBola (float)
predictions_list[5] → exigenciaFisica (float)
predictions_list[6] → puntoImpacto (float)
predictions_list[7] → tecnica (float)
predictions_list[8] → posibilidadLesion (float)
predictions_list[9] → consejo_error (7 classes)
```

## Integration Flow

### Training Flow (Trainer Mode)
1. Trainer selects stroke type, manually inputs 9 metrics + selects error from dropdown
2. Frontend sends `consejo_error_idx` (0-6 integer) + 9 metrics to `/entrenar-golpe/`
3. Backend validates trainer permission, builds one-hot tensors for all 10 outputs
4. Model trained on batch=1 with all 10 labels
5. Model saved and updated with new knowledge

### Inference Flow (Live Prediction)
1. Real sensor data captured (50 timesteps, 10 features)
2. Frontend calls `/predecir-golpe-ia/` with X data
3. Backend normalizes data, runs inference through model
4. Model outputs 10 predictions (9 metrics + 7 error probabilities)
5. Backend:
   - Extracts argmax indices for categorical outputs
   - Maps consejo_error_idx to text using catalog
   - Returns all predictions + mapped error text
6. Frontend displays prediction with advice/error

## Files Modified

### Backend
- **padel_stats/cnn_model.py**: Model architecture (10 outputs), training function update, inference function
- **padel_stats/views.py**: Updated `/entrenar-golpe/` endpoint, new `/predecir-golpe-ia/` endpoint
- **padel_stats/urls.py**: Added route for predecir_golpe_ia endpoint

### Frontend
- **app/IniciarSesion.js**: Updated enviarYEntrenar to include consejo_error_idx mapping

## Pending Actions

### 1. Database Migration
```bash
python manage.py migrate
```
This applies migration 0012_usuarios_es_entrenador.py (already created).

### 2. Model Training
- Model needs to be trained on at least a few golpes with consejo_error labels
- Initial training will establish baseline for error prediction
- Subsequent trainer inputs will improve accuracy

### 3. Frontend Testing
- Test consejo_error Picker selection
- Verify payload structure sent to /entrenar-golpe/
- Test inference response parsing and display

### 4. Backend Testing
- Verify /entrenar-golpe/ accepts consejo_error_idx
- Test /predecir-golpe-ia/ returns all 10 outputs correctly
- Verify catalog fallback when error not found

## Error/Advice Catalog Integration

The 7 error/advice categories are:
1. **Punto de impacto tardío**: Strike point too late
2. **Armado incompleto**: Incomplete arm preparation
3. **Terminado inestable**: Unstable finish
4. **Transferencia de peso débil**: Weak weight transfer
5. **Recuperación lenta**: Slow recovery
6. **Carga excesiva en muñeca/hombro**: Excessive wrist/shoulder load
7. **Base sólida**: Solid technique (no error)

These map to indices 0-6 and are used throughout:
- Trainer selection dropdown (7 options)
- Model output (argmax of 7-class softmax)
- Catalog lookup by tipo_golpe + error_idx
- Frontend display in predictions

## Context-Aware Prediction

Error prediction now considers stroke type:
- Different stroke types (Bandeja, Víbora, Remate, etc.) may have type-specific error interpretations
- Backend catalog can have different error texts per stroke type
- Model learns stroke-specific error patterns during training
- Inference respects the predicted stroke type when selecting error text

## Technical Notes

### One-Hot Encoding
- consejo_error: one-hot(7) - 7 possible error classes
- tipo_golpe: one-hot(14) - 14 stroke types
- efecto: one-hot(3) - 3 effect types

### Normalization
- Input data normalized using shared scaler (scaler_padel.joblib)
- Scaler fit during training, reused during inference
- Ensures consistent feature scaling across training/inference

### Loss Function
- Categorical outputs (tipo_golpe, efecto, consejo_error): categorical_crossentropy
- Continuous outputs (metrics): mean squared error (mse)
- Weighted equally in training

## Next Steps

1. Run migration: `python manage.py migrate`
2. Test trainer mode with consejo_error selection
3. Train model on sample golpes with all 10 labels
4. Test inference and verify consejo_error predictions
5. Integrate with session analytics (error frequency calculation)
6. Deploy and monitor model accuracy

## Rollback Notes

If issues arise:
- Model can be retrained with previous 9 outputs by removing consejo_error from loss dict
- Frontend payload can revert to sending consejo_error as string instead of index
- Inference endpoint can be simplified to skip consejo_error processing
- All changes are backward compatible - 10th output doesn't break existing 9 outputs
