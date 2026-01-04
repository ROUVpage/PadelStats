import os
import tensorflow.compat.v1 as tf
tf.disable_v2_behavior()

# Configuración para CPU antigua
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_DISABLE_MKL'] = '1'

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

def crear_modelo_cnn():
    # Configuración para CPUs más antiguas
    config = tf.ConfigProto(
        intra_op_parallelism_threads=1,
        inter_op_parallelism_threads=1,
        allow_soft_placement=True,
        device_count={'CPU': 1}
    )
    tf.Session(config=config)

    # Modelo híbrido CNN + LSTM para captar patrones temporales del golpe
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import Dense, Conv1D, MaxPooling1D, LSTM, Dropout, Input, BatchNormalization

    entrada = Input(shape=(50, 10))

    x = Conv1D(16, 3, activation='relu', padding='same')(entrada)
    x = BatchNormalization()(x)
    x = MaxPooling1D(2)(x)
    x = Conv1D(8, 3, activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = MaxPooling1D(2)(x)

    # LSTM captura la secuencia del swing
    x = LSTM(32, return_sequences=False)(x)
    x = Dropout(0.15)(x)
    x = Dense(32, activation='relu')(x)

    # Salidas con todas las predicciones requeridas
    outputs = []
    outputs.append(Dense(14, activation='softmax', name='tipo_golpe')(x))  # 14 tipos definidos en frontend/backend
    outputs.append(Dense(1, activation='linear', name='precision')(x))  # 1-10
    outputs.append(Dense(1, activation='linear', name='potencia')(x))  # 1-10
    outputs.append(Dense(3, activation='softmax', name='efecto')(x))  # plano, cortado, liftado
    outputs.append(Dense(1, activation='linear', name='velocidadBola')(x))  # km/h
    outputs.append(Dense(1, activation='linear', name='exigenciaFisica')(x))  # 1-10
    outputs.append(Dense(1, activation='linear', name='puntoImpacto')(x))  # 1-5
    outputs.append(Dense(1, activation='linear', name='tecnica')(x))  # 1-10
    outputs.append(Dense(1, activation='linear', name='posibilidadLesion')(x))  # 1-5
    outputs.append(Dense(8, activation='softmax', name='consejo_error')(x))  # 8 criterios de evaluación técnica

    model_final = Model(inputs=entrada, outputs=outputs)

    # Compilar con optimizador ligero
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
            'consejo_error': 'categorical_crossentropy'
        },
        metrics={
            'tipo_golpe': 'accuracy',
            'efecto': 'accuracy',
            'consejo_error': 'accuracy'
        }
    )

    return model_final

def _cargar_o_crear_scaler():
    try:
        scaler = joblib.load('scaler_padel.joblib')
    except Exception:
        scaler = None
    return scaler


def _guardar_scaler(scaler):
    try:
        joblib.dump(scaler, 'scaler_padel.joblib')
    except Exception:
        pass


def preprocesar_datos_batch(df_batch, fit_scaler=False):
    """
    Normaliza un batch completo (DataFrame o ndarray) a shape (batch, 50, features).
    - Si fit_scaler=True, se ajusta un nuevo scaler y se guarda.
    - Si fit_scaler=False, se carga scaler existente; si no existe, se ajusta con el batch y se guarda.
    """
    if isinstance(df_batch, np.ndarray):
        data_np = df_batch
    else:
        data_np = df_batch.to_numpy()

    # Si viene como (batch, features) y no incluye timesteps, no lo usamos aquí; asumimos shape (batch, 50, feats)
    if len(data_np.shape) == 2:
        # asumir que es (batch*50, feats) y no conviene; devolvemos expandido
        data_np = data_np.reshape((-1, 50, data_np.shape[1]))

    batch, timesteps, feats = data_np.shape

    scaler = _cargar_o_crear_scaler()
    if fit_scaler or scaler is None:
        scaler = StandardScaler()
        flat = data_np.reshape(-1, feats)
        scaler.fit(flat)
        _guardar_scaler(scaler)

    flat = data_np.reshape(-1, feats)
    flat_norm = scaler.transform(flat)
    data_norm = flat_norm.reshape(batch, timesteps, feats)
    return data_norm

def entrenar_o_cargar_modelo(datos_nuevos=None, epochs_nuevo=1, fit_scaler=False):
    """
    Entrena o carga el modelo para las 10 salidas (9 metrics + consejo_error).
    datos_nuevos debe ser un dict con:
      - 'X': ndarray (batch, 50, 10) crudo o sin normalizar
      - 'y': dict con claves: tipo_golpe (one-hot 14), efecto (one-hot 3), consejo_error (one-hot 8),
             y regresiones: precision, potencia, velocidadBola, exigenciaFisica, puntoImpacto, tecnica, 
             posibilidadLesion (cada uno shape (batch,1))
    """
    try:
        modelo = tf.keras.models.load_model('modelo_padel_cnn.h5')
    except Exception:
        modelo = crear_modelo_cnn()

    if datos_nuevos:
        X_raw = datos_nuevos['X']
        y = datos_nuevos['y']

        X_norm = preprocesar_datos_batch(X_raw, fit_scaler=fit_scaler)

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
                'consejo_error': y['consejo_error']
            },
            epochs=epochs_nuevo,
            verbose=0
        )
        modelo.save('modelo_padel_cnn.h5')

    return modelo

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
    # Orden: tipo_golpe, precision, potencia, efecto, velocidadBola, exigenciaFisica, 
    #        puntoImpacto, tecnica, posibilidadLesion, consejo_error
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