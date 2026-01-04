@echo off
echo ========================================
echo   Verificación de Conectividad para
echo   Emulador Android (10.0.2.2:8000)
echo ========================================
echo.

echo ✅ Servidor ejecutándose en: http://0.0.0.0:8000/
echo ✅ Accesible desde emulador Android en: http://10.0.2.2:8000/
echo.

echo 📱 URLs para configurar en tu app React Native/Expo:
echo.
echo const BASE_URL = "http://10.0.2.2:8000";
echo.

echo 🔍 Endpoints disponibles para probar desde el emulador:
echo.
echo 1. Health Check:     http://10.0.2.2:8000/datos/
echo 2. API Root:         http://10.0.2.2:8000/datos/api/
echo 3. Usuarios:         http://10.0.2.2:8000/datos/api/usuarios/
echo 4. Sesiones:         http://10.0.2.2:8000/datos/api/sesiones/
echo 5. Datos IA:         http://10.0.2.2:8000/datos/api/datosIA/
echo 6. Check Device:     http://10.0.2.2:8000/datos/auth/check-device/
echo.

echo 📋 Para verificar desde el navegador del emulador:
echo    Abre el navegador en el emulador Android
echo    Ve a: http://10.0.2.2:8000/datos/
echo    Deberías ver información JSON del servidor
echo.

echo 🚀 Tu app móvil ahora debería poder conectarse exitosamente!
echo.

pause
