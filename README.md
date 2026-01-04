# PadelStats

Sistema integrado de análisis y seguimiento de estadísticas en Pádel con inteligencia artificial.

## Estructura del Proyecto

```
PadelStats/
├── padel_Stats_backend/     # Django REST API + Modelo CNN+LSTM
└── PadelStats_frontend/     # React Native + Expo Mobile App
```

## Requisitos

### Backend
- Python 3.8+
- Django 3.2+
- TensorFlow 2.x
- PostgreSQL (opcional, por defecto SQLite)

### Frontend
- Node.js 14+
- React Native 0.71+
- Expo CLI

## Instalación

### Backend
```bash
cd padel_Stats_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd PadelStats_frontend
npm install
npx expo start
```

## Estructura Técnica

### Backend (padel_Stats_backend/)
- **CNN+LSTM Model**: Análisis de movimiento desde sensores (acelerómetro, giroscopio)
- **10 Salidas de predicción**:
  - tipo_golpe (14 clases)
  - 8 métricas técnicas (0-10)
  - efecto (3 clases)
  - consejo_error (8 criterios)
- **API REST**: Endpoints para usuarios, sesiones, datos IA
- **8 Criterios Técnicos**: Armado, Peso, Flexión, Impacto, Golpeo, Brazo, Cuerpo, Posición

### Frontend (PadelStats_frontend/)
- **Bluetooth Integration**: Conexión con sensores móviles
- **Real-time Feedback**: Detección en tiempo real durante sesión
- **Analytics Dashboard**: Visualización de progreso y estadísticas
- **Player Profiles**: Seguimiento individual de jugadores

## Features Principales

✅ Detección automática de tipos de golpe (14 variantes)
✅ Análisis técnico en 8 criterios diferentes
✅ Feedback en tiempo real durante sesión
✅ Gráficas de progreso del nivel
✅ Análisis de errores más comunes
✅ Recomendaciones personalizadas de mejora
✅ Historial completo de sesiones

## Desarrollo

Para cambios en el código:

1. **Backend**: Los cambios en modelos requieren nuevas migraciones
2. **Frontend**: Los cambios en navegación requieren actualizar rutas en Expo Router
3. **API**: Documentación automática en `/api/docs/` (Django)

## Licencia

Privado - ROUVpage
