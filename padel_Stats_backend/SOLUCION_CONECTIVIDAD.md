# Guía de Solución para Conectividad Móvil

## ❌ Problema Actual
```
LOG  🏥 Health check: ❌ Failed
LOG  👥 Error en endpoint usuarios: Network request failed
LOG  🎾 Error en endpoint sesiones: Network request failed
LOG  🤖 Error en endpoint datos IA: Network request failed
```

## ✅ Backend Funcionando
- ✅ Servidor activo en `http://0.0.0.0:8000`
- ✅ Base de datos con datos de ejemplo
- ✅ CORS configurado
- ✅ Endpoints respondiendo localmente

## 🔧 Solución Paso a Paso

### Paso 1: Identificar tu tipo de dispositivo

**¿Estás usando un emulador Android o un dispositivo físico?**

#### Para EMULADOR ANDROID:
```javascript
// En tu app frontend, cambia la URL base a:
const BASE_URL = "http://10.0.2.2:8000";
```

#### Para DISPOSITIVO FÍSICO:
```javascript
// Necesitas la IP de tu PC. Ejecuta en cmd:
// ipconfig | findstr "IPv4"
// Ejemplo: si tu IP es 192.168.1.123
const BASE_URL = "http://192.168.1.123:8000";
```

### Paso 2: Verificar conectividad

1. **Desde el navegador del dispositivo móvil**, accede a:
   - Emulador: `http://10.0.2.2:8000/datos/`
   - Físico: `http://[TU_IP]:8000/datos/`

2. **Deberías ver un JSON** con información del servidor.

### Paso 3: Configurar tu aplicación

En tu archivo de configuración de red de la app React Native/Expo:

```javascript
// Configuración dinámica recomendada
const getBaseURL = () => {
  if (__DEV__) {
    // Para desarrollo
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';  // Emulador Android
    } else {
      return 'http://127.0.0.1:8000'; // iOS Simulator
    }
  }
  return 'https://tu-servidor-produccion.com'; // Producción
};

const BASE_URL = getBaseURL();
```

### Paso 4: Probar endpoints específicos

Una vez configurada la URL, prueba estos endpoints:

```javascript
// Health check
fetch(`${BASE_URL}/datos/`)

// Usuarios
fetch(`${BASE_URL}/datos/api/usuarios/`)

// Sesiones  
fetch(`${BASE_URL}/datos/api/sesiones/`)

// Datos IA
fetch(`${BASE_URL}/datos/api/datosIA/`)
```

## 🚨 Problemas Comunes y Soluciones

### Error: "Network request failed"
- ✅ **Causa:** URL incorrecta para el tipo de dispositivo
- ✅ **Solución:** Usar la URL correcta según el dispositivo

### Error: "CORS policy"
- ✅ **Estado:** Ya configurado en el backend
- ✅ **Verificación:** `CORS_ALLOW_ALL_ORIGINS = True`

### Error: "Connection refused"
- ✅ **Verificar:** Backend ejecutándose en `0.0.0.0:8000`
- ✅ **Comando:** Ver si el servidor está activo

### Firewall de Windows
- ⚠️ **Posible causa:** Firewall bloqueando el puerto 8000
- ✅ **Solución temporal:** Desactivar firewall para pruebas

## 📱 URLs de Prueba por Dispositivo

| Dispositivo | URL de Health Check |
|-------------|-------------------|
| Emulador Android | `http://10.0.2.2:8000/datos/` |
| iOS Simulator | `http://127.0.0.1:8000/datos/` |
| Android Físico | `http://[IP_PC]:8000/datos/` |
| iOS Físico | `http://[IP_PC]:8000/datos/` |

## 🔄 Siguiente Paso

1. **Identifica tu tipo de dispositivo**
2. **Usa la URL correspondiente**
3. **Prueba en el navegador del dispositivo primero**
4. **Configura tu app con la URL correcta**
5. **Reporta el resultado**

## 📞 Información de Diagnóstico

Para obtener información detallada del servidor:
`http://[URL_CORRECTA]:8000/datos/`

Este endpoint te dará toda la información necesaria para diagnosticar el problema.
