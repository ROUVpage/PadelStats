# Mapeo Tipo-Específico de Errores/Consejos

## 🎯 Cómo Funciona

La IA ahora predice errores **específicos para cada tipo de golpe**. Cada uno de los 14 tipos de golpe tiene sus propios 7 errores/consejos:

```
14 Tipos de Golpe × 7 Errores/Consejos = 98 Frases Técnicas Específicas
```

## 🔄 Flujo de Predicción

```
1. Sensor Data (50x10)
   ↓
2. Model Predict
   ├─ tipo_golpe → argmax → tipo_idx (0-13)
   ├─ precision → float
   ├─ potencia → float
   ├─ efecto → argmax → efecto_idx (0-2)
   ├─ velocidadBola → float
   ├─ exigenciaFisica → float
   ├─ puntoImpacto → float
   ├─ tecnica → float
   ├─ posibilidadLesion → float
   └─ consejo_error → argmax → consejo_error_idx (0-6)
   ↓
3. Mapear tipo_idx → tipo_golpe_text
   ↓
4. Lookup: CONSEJOS_CATALOG[tipo_golpe_text][consejo_error_idx]
   ↓
5. Retornar consejo_error_text específico para ese golpe
```

## 📋 Estructura del Catálogo

### Antes (Genérico):
```python
CONSEJOS_CATALOG = {
    "Derecha": { "error_key": "texto genérico", ... },
    "Revés": { "error_key": "texto genérico", ... }
}
```

### Ahora (Tipo-Específico):
```python
CONSEJOS_CATALOG = {
    "Bandeja": {
        0: "Consejo específico para punto de impacto tardío EN BANDEJA",
        1: "Consejo específico para armado incompleto EN BANDEJA",
        2: "Consejo específico para terminado inestable EN BANDEJA",
        ...
        6: "Bandeja ejecutada perfectamente"
    },
    "Víbora": {
        0: "Consejo específico para punto de impacto tardío EN VÍBORA",
        1: "Consejo específico para armado incompleto EN VÍBORA",
        ...
        6: "Víbora ejecutada perfectamente"
    },
    ...
}
```

## 🏓 Los 14 Tipos de Golpe

1. **Bandeja** - Golpe defensivo alto
2. **Víbora** - Golpe defensivo bajo
3. **Remate liftado** - Ataque con curva
4. **Remate plano** - Ataque directo
5. **Volea de derecha** - Volea derecha en red
6. **Volea de derecha baja** - Volea derecha baja
7. **Volea de revés** - Volea revés en red
8. **Volea de revés baja** - Volea revés baja
9. **derecha** - Golpe de fondo derecha
10. **reves** - Golpe de fondo revés
11. **derecha con pared** - Golpe de pared derecha
12. **reves con pared** - Golpe de pared revés
13. **bajada de derecha** - Bajada derecha (punto)
14. **bajada de reves** - Bajada revés (punto)

## ⚠️ Los 7 Índices de Error/Consejo

| Idx | Categoría | Descripción |
|-----|-----------|---|
| 0 | Error técnico primario | Punto de contacto, timing |
| 1 | Error de preparación | Armado, carga, setup |
| 2 | Error de impacto/terminación | Bloqueo, acompañamiento |
| 3 | Error de transferencia de peso | Peso corporal, rotación |
| 4 | Error de recuperación | Vuelve a posición, movimiento |
| 5 | Error de protección articular | Carga en muñeca/hombro |
| 6 | Base sólida | Ejecución perfecta ✓ |

## 💡 Ejemplos de Especificidad

### Para "Bandeja" (índice 0 = Punto de impacto tardío):
```
"Contacta la pelota más alta, sobre la cabeza. 
Evita el punto de impacto bajo que reduce precisión."
```

### Para "Víbora" (índice 0 = Punto de impacto tardío):
```
"Contacta cerca del piso pero delante del cuerpo 
para máximo control. No dejes que baje demasiado."
```

### Para "Remate" (índice 0 = Punto de impacto tardío):
```
"Salta o avanza para contactar el punto más alto posible; 
máxima alcance."
```

**NOTA**: El error índice 0 es diferente para cada golpe porque el "punto tardío" es técnicamente diferente en:
- Bandeja: contacto sobre la cabeza (alto)
- Víbora: contacto cerca del piso (bajo)
- Remate: contacto en el punto máximo del salto

## 🧠 Cómo Aprende el Modelo

Durante el entrenamiento manual (Trainer Mode):

1. Entrenador etiqueta: tipo_golpe=2 (Remate liftado), consejo_error_idx=3
2. Modelo aprende: "Cuando tipo_golpe=2, consejo_error probablemente=3"
3. Predic sensorial se asocia con: "Impulsa fuertemente con ambas piernas"

El modelo construye **correlaciones tipo-específicas**:
- Sensor patterns + tipo_golpe → predice consejo_error_idx
- consejo_error_idx + tipo_golpe → lookup de texto específico

## 📊 Respuesta de Predicción

```json
{
  "success": true,
  "tipo_golpe_idx": 0,
  "tipo_golpe": "Bandeja",
  "consejo_error_idx": 3,
  "consejo_error_category": "Error de transferencia de peso",
  "consejo_error_text": "Transfiere peso desde atrás hacia adelante; apóyate en la pierna de atrás para generar potencia.",
  
  "precision": 7.5,
  "potencia": 8.2,
  ...demás métricas...
}
```

## ✨ Ventajas de Este Diseño

✅ **Específico**: Cada golpe tiene sus propios consejos
✅ **Context-aware**: El error se entiende en contexto del golpe
✅ **Técnicamente correcto**: Los consejos son apropiados para cada técnica
✅ **Escalable**: Fácil agregar más golpes o errores
✅ **Mantenible**: Catálogo centralizado y estructurado
✅ **Aprendizaje mejorado**: Modelo aprende patrones tipo-específicos

## 🔄 Integración con Entrenador

Cuando el entrenador etiqueta:

```
Tipo: Remate plano
Error: 2 (Terminado inestable)
```

El sistema hace:

1. One-hot(Remate plano=3) → y['tipo_golpe']
2. One-hot(2) → y['consejo_error']
3. Model aprende: sensores + remate plano → error terminado inestable
4. Próxima predicción similar → "Impacto explosivo con extensión completa..."

## 📱 Frontend Display

Cuando muestra predicción:

```
Tipo de golpe: Bandeja
Precisión: 7.5 / 10
Potencia: 8.2 / 10
...

Error/Consejo Técnico:
┌─────────────────────────────────┐
│ Transferencia de peso débil    │
├─────────────────────────────────┤
│ Transfiere peso desde atrás     │
│ hacia adelante; apóyate en la   │
│ pierna de atrás para generar    │
│ potencia.                        │
└─────────────────────────────────┘
```

## 🛡️ Fallback Strategy

Si algo no se encuentra:

```
1. Buscar: CONSEJOS_CATALOG["Bandeja"][3]
   ✓ Encontrado → usar ese texto

2. Si no existe el golpe o índice:
   Usar: DEFAULT_FALLBACK[3]
   (Texto genérico para ese índice)

3. Si nada funciona:
   Usar: "Consejo no disponible"
```

## 🚀 Próximos Pasos

1. ✅ Catálogo con errores tipo-específicos
2. ✅ Endpoint predecir-golpe-ia mapea correctamente
3. ✅ Frontend recibe consejo_error_text específico
4. ⏳ Entrenador etiqueta golpes con consejo_error_idx
5. ⏳ Modelo aprende correlaciones tipo-específicas
6. ⏳ Predicciones mejoran con cada entrenamiento

## 📚 Archivos Afectados

- `consejos_catalogo.py` - Catálogo completo (98 frases)
- `views.py` - Endpoint predecir_golpe_ia con lookup tipo-específico
- `IniciarSesion.js` - Frontend envía consejo_error_idx

---

**Estado**: ✅ Sistema **100% tipo-específico** implementado
**Verificación**: ✅ Sin errores de sintaxis, lógica correcta
