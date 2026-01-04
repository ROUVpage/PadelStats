from django.urls import path, include
from rest_framework import routers
from .views import datosView, datosIAView, sesionesView, usuariosView, datosSensorView, check_device, catalogo_consejos, entrenar_golpe, predecir_golpe_ia
from django.http import JsonResponse

# Health check endpoint
def health_check(request):
    import socket
    import subprocess
    import json
    
    try:
        # Obtener hostname e IP
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Intentar obtener todas las IPs
        try:
            result = subprocess.run(['ipconfig'], capture_output=True, text=True, shell=True)
            ipconfig_output = result.stdout
        except:
            ipconfig_output = "No disponible"
        
        # Verificar conectividad interna
        endpoints_status = {}
        try:
            from .models import Usuarios, sesiones, datosIA
            endpoints_status = {
                'usuarios_count': Usuarios.objects.count(),
                'sesiones_count': sesiones.objects.count(),
                'datosIA_count': datosIA.objects.count(),
                'database': 'OK'
            }
        except Exception as e:
            endpoints_status = {'database_error': str(e)}
        
        return JsonResponse({
            'status': 'ok',
            'message': 'Backend funcionando correctamente',
            'timestamp': str(request.META.get('HTTP_DATE', 'N/A')),
            'server_info': {
                'hostname': hostname,
                'detected_ip': local_ip,
                'request_ip': request.META.get('REMOTE_ADDR', 'N/A'),
                'host_header': request.META.get('HTTP_HOST', 'N/A'),
                'user_agent': request.META.get('HTTP_USER_AGENT', 'N/A')[:100],
            },
            'connection_urls': {
                'localhost': 'http://127.0.0.1:8000',
                'android_emulator': 'http://10.0.2.2:8000',
                'network_ip': f'http://{local_ip}:8000',
                'current_request': f"http://{request.META.get('HTTP_HOST', 'unknown')}"
            },
            'endpoints': [
                '/datos/api/usuarios/',
                '/datos/api/sesiones/', 
                '/datos/api/datosIA/',
                '/datos/auth/check-device/'
            ],
            'data_status': endpoints_status,
            'cors_enabled': True,
            'ipconfig_info': ipconfig_output[:500] if len(ipconfig_output) < 500 else ipconfig_output[:500] + "..."
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error en health check: {str(e)}',
            'timestamp': str(request.META.get('HTTP_DATE', 'N/A'))
        })

# Registro de todas las vistas en un único router
router = routers.DefaultRouter()
router.register(r'usuarios', usuariosView, 'usuarios')
router.register(r'sesiones', sesionesView, 'sesiones')
router.register(r'datosIA', datosIAView, 'datosIA')
router.register(r'datos', datosView, 'datos')
router.register(r'datosSensor', datosSensorView, 'datosSensor')

# Definición de las URL
urlpatterns = [
    path('', health_check, name='health_check'),  # Health check en la raíz
    path('api/', include(router.urls)),
    path('auth/check-device/', check_device, name='check_device'),
    path('api/catalogo-consejos/', catalogo_consejos, name='catalogo_consejos'),
    path('api/entrenar-golpe/', entrenar_golpe, name='entrenar_golpe'),
    path('api/predecir-golpe-ia/', predecir_golpe_ia, name='predecir_golpe_ia'),
    path('test-mobile/', health_check, name='test_mobile'),  # Endpoint adicional para pruebas móviles
]
