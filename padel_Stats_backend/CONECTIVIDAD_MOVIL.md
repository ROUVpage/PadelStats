# Configuración de Conectividad para Aplicación Móvil

## Problema Actual
La aplicación móvil está intentando conectarse a `http://127.0.0.1:8000` pero no puede alcanzar el backend.

## Soluciones por Tipo de Dispositivo

### 1. Emulador Android (Recomendado para desarrollo) ✅ CONFIGURADO
**URL a usar en la app:** `http://10.0.2.2:8000`

- ✅ **SERVIDOR ACTIVO:** Backend ejecutándose en `0.0.0.0:8000`
- ✅ **ACCESIBLE:** El emulador Android mapea `10.0.2.2` al `127.0.0.1` del host
- ✅ **DATOS:** Base de datos con usuarios, sesiones y datos IA de ejemplo
- ✅ **CORS:** Configurado para aceptar conexiones del emulador

**🔧 Configuración en tu app:**
```javascript
const BASE_URL = "http://10.0.2.2:8000";
```

**🧪 Para probar desde el navegador del emulador:**
Ve a: `http://10.0.2.2:8000/datos/`

### 2. Dispositivo Físico Android
**URL a usar en la app:** `http://[IP_DE_TU_PC]:8000`

Para encontrar la IP de tu PC:
```cmd
ipconfig | findstr "IPv4"
```

Ejemplo: si tu IP es `192.168.1.100`, usa `http://192.168.1.100:8000`

### 3. iOS Simulator
**URL a usar en la app:** `http://127.0.0.1:8000`

- iOS Simulator puede acceder directamente a localhost del host

### 4. Dispositivo Físico iOS
**URL a usar en la app:** `http://[IP_DE_TU_PC]:8000`

Mismo procedimiento que Android físico.

## Verificación de Conectividad

### Endpoints para Probar:
1. **Health Check:** `http://[URL]:8000/datos/`
2. **API Root:** `http://[URL]:8000/datos/api/`
3. **Usuarios:** `http://[URL]:8000/datos/api/usuarios/`
4. **Sesiones:** `http://[URL]:8000/datos/api/sesiones/`
5. **Datos IA:** `http://[URL]:8000/datos/api/datosIA/`

### En el Navegador del Dispositivo Móvil:
Prueba acceder a: `http://[URL]:8000/datos/` directamente desde el navegador del dispositivo.

## Configuración del Backend

El backend ya está configurado para:
✅ Aceptar conexiones desde todas las interfaces (`0.0.0.0:8000`)
✅ CORS habilitado para las URLs más comunes
✅ Datos de ejemplo creados

## Cambios Necesarios en la App Frontend

1. **Cambiar la URL base** en tu configuración de la app de:
   ```javascript
   const BASE_URL = "http://127.0.0.1:8000";
   ```
   
   A (según tu caso):
   ```javascript
   // Para emulador Android
   const BASE_URL = "http://10.0.2.2:8000";
   
   // Para dispositivo físico (ejemplo)
   const BASE_URL = "http://192.168.1.100:8000";
   ```

2. **Verificar que CORS esté funcionando** - ya está configurado en el backend

## Comandos Útiles

### Reiniciar el servidor:
```cmd
cd "c:\Seba\descargas\padel_Stats_backend"
venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8000
```

### Verificar endpoints:
- Health check principal: http://127.0.0.1:8000/
- Health check datos: http://127.0.0.1:8000/datos/
- API navegable: http://127.0.0.1:8000/datos/api/

## Estado Actual del Backend
✅ **Servidor funcionando** en `0.0.0.0:8000`
✅ **Base de datos** con migraciones aplicadas
✅ **Datos de ejemplo** creados (4 usuarios, 5 sesiones, 10 datos IA)
✅ **CORS** configurado
✅ **Endpoints** respondiendo correctamente
