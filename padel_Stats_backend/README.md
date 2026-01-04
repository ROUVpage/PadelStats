# Padel Stats Backend

Backend desarrollado en Django para el análisis de estadísticas de pádel con funcionalidades de IA.

## Configuración e Instalación

### Requisitos
- Python 3.13+
- pip

### Instalación

1. **Activar el entorno virtual:**
   ```cmd
   venv\Scripts\activate.bat
   ```

2. **Instalar dependencias básicas (ya instaladas):**
   ```cmd
   pip install Django djangorestframework django-cors-headers Pillow
   ```

3. **Ejecutar migraciones:**
   ```cmd
   python manage.py migrate
   ```

4. **Crear superusuario (opcional):**
   ```cmd
   python manage.py createsuperuser
   ```

5. **Iniciar el servidor:**
   ```cmd
   python manage.py runserver
   ```

## Uso

### Servidor de Desarrollo
El servidor estará disponible en: http://127.0.0.1:8000/

### Endpoints API Disponibles

#### API Principal
- `GET /datos/api/` - Interfaz de navegación de la API REST

#### Modelos disponibles:
- `GET/POST /datos/api/datos/` - Datos de entrenamiento
- `GET/POST /datos/api/datosIA/` - Datos de IA
- `GET/POST /datos/api/sesiones/` - Sesiones de juego
- `GET/POST /datos/api/usuarios/` - Usuarios
- `GET/POST /datos/api/datosSensor/` - Datos de sensores

#### Endpoints de Autenticación:
- `POST /datos/auth/check-device/` - Verificar/crear dispositivo

#### Endpoints de IA (temporalmente simplificados):
- `GET /datos/api/prediccion/<distancia>/<ax>/<ay>/` - Predicción de golpe
- `POST /datos/api/entrenar_con_datos/` - Entrenar modelo
- `POST /datos/predecir-golpe/` - Predicir tipo de golpe
- `POST /datos/entrenar-modelo/` - Entrenar modelo CNN

### Panel de Administración
Disponible en: http://127.0.0.1:8000/admin/
(Requiere crear un superusuario)

## Configuración CORS

El backend está configurado para aceptar conexiones desde:
- http://localhost:3000
- http://localhost:19006
- http://127.0.0.1:3000
- http://127.0.0.1:19006
- exp://127.0.0.1:19000
- http://10.0.2.2:8000
- http://192.168.1.100:8000

## Estado Actual

✅ **Funcionando:**
- Servidor Django en `0.0.0.0:8000`
- API REST básica con datos de ejemplo
- Modelos de base de datos
- Migraciones aplicadas
- CORS configurado para múltiples URLs
- Endpoints básicos respondiendo

**Datos de ejemplo creados:**
- 4 usuarios de prueba
- 5 sesiones de ejemplo
- 10 registros de datos IA

⚠️ **Pendiente/Limitado:**
- Funcionalidades de IA (TensorFlow requiere configuración adicional para Python 3.13)
- Documentación automática (coreapi incompatible con Python 3.13)

## Conectividad Móvil

⚠️ **Problema común:** La app móvil no puede conectarse usando `127.0.0.1:8000`

**Soluciones:**
- **Emulador Android:** usar `http://10.0.2.2:8000`
- **Dispositivo físico:** usar `http://[IP_DE_TU_PC]:8000`
- **iOS Simulator:** usar `http://127.0.0.1:8000`

Ver `CONECTIVIDAD_MOVIL.md` para instrucciones detalladas.

## Dependencias Pendientes de IA

Para habilitar las funcionalidades completas de IA, instalar:
```cmd
pip install tensorflow scikit-learn numpy pandas joblib xgboost h5py
```

**Nota:** Algunas dependencias pueden requerir configuración adicional para Python 3.13.

## Solución de Problemas

### Errores comunes:
1. **"Could not find platform independent libraries"** - Warning normal, no afecta funcionalidad
2. **Errores de TensorFlow** - Funcionalidades de IA temporalmente simplificadas
3. **Errores de coreapi** - Documentación automática deshabilitada

### Reiniciar el servidor:
```cmd
venv\Scripts\activate.bat
python manage.py runserver
```
