@echo off
echo ==========================================
echo    Padel Stats Backend - Servidor Django
echo ==========================================
echo.

cd /d "c:\Seba\descargas\padel_Stats_backend"

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo Verificando estado de la base de datos...
python manage.py showmigrations

echo.
echo Iniciando servidor en http://127.0.0.1:8000/
echo Presiona Ctrl+C para detener el servidor
echo.
echo Endpoints disponibles:
echo - API: http://127.0.0.1:8000/datos/api/
echo - Admin: http://127.0.0.1:8000/admin/
echo.

python manage.py runserver

pause
