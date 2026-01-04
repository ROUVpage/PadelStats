# Catálogo centralizado de frases de consejo técnico por tipo de golpe y 8 criterios
# Cada tipo de golpe tiene 8 criterios técnicos específicos (índices 0-7)
# Los criterios se basan en evaluación técnica de padel profesional

# Mapeo de índices a criterios de evaluación técnica
ERROR_CATEGORIES = {
    0: 'Armado/Preparación',
    1: 'Peso corporal',
    2: 'Flexión de piernas',
    3: 'Punto de impacto',
    4: 'Tipo de golpeo',
    5: 'Finalización brazo',
    6: 'Terminación corporal',
    7: 'Posición de impacto'
}

CONSEJOS_CATALOG = {
    "Bandeja": {
        0: "Prepara la pala más arriba sobre la cabeza; abre el hombro completamente para troleo alto.",
        1: "Carga el peso hacia atrás; trasfiérelo adelante en la ejecución para generar potencia controlada.",
        2: "Flexiona ligeramente las piernas para mejor estabilidad; usa caderas en la extensión.",
        3: "Contacta la pelota lo más alto posible, sobre la cabeza; evita puntos de impacto bajos.",
        4: "Golpea suavemente desde arriba hacia abajo; bandeja requiere control, no potencia.",
        5: "Acompaña hacia adelante tras impacto con brazo completo; termina con pala controlada.",
        6: "Mantén tronco erguido; recupera posición de espera con pequeños pasos rápidos.",
        7: "Usa brazo no dominante para equilibrio; mantén ambos brazos cerca del cuerpo."
    },
    "Vibora": {
        0: "Prepara con pala en posición baja y cerrada; carga hacia atrás con tiempo suficiente.",
        1: "Golpea desde posición baja; transfiere peso con control desde pierna trasera.",
        2: "Flexiona piernas significativamente; la potencia viene principalmente de caderas y piernas.",
        3: "Contacta cerca del piso pero delante del cuerpo; no dejes que la pelota siga bajando.",
        4: "Levanta la pelota suavemente desde abajo hacia arriba; movimiento ascendente controlado.",
        5: "Extiende brazo hacia adelante-arriba; termina con pala más alta que punto de impacto.",
        6: "Rota cadera y hombros; recupera rápido a posición defensiva central.",
        7: "Mantén la pelota en posición controlada durante toda la ejecución; evita movimientos bruscos."
    },
    "Remate liftado": {
        0: "Armado en troleo completo; brazo no dominante señala la pelota para timing perfecto.",
        1: "Carga peso en pierna trasera; impulsa fuerte hacia adelante en la ejecución.",
        2: "Flexiona y extiende piernas explosivamente; genera toda la potencia desde abajo.",
        3: "Salta o avanza para alcanzar punto más alto posible; máxima alcance y dominio.",
        4: "Rota y gira en remate; impacto es de liftada (ascendente con spin).",
        5: "Extiende brazo completamente; termina cruzando cuerpo con cadena cinética completa.",
        6: "Rota caderas y hombros explosivamente; regresa rápido a posición o avanza a red.",
        7: "Brazo no dominante actúa como contrapeso; termina en posición controlada."
    },
    "Remate plano": {
        0: "Troleo alto y abierto; hombros y brazos extendidos hacia atrás en armado.",
        1: "Impulsa fuertemente con piernas; trasfiere todo el peso adelante.",
        2: "Extiende piernas al máximo; impulsión explosiva de abajo hacia arriba.",
        3: "Punto de impacto alto y adelantado; busca contacto decidido y sin dudas.",
        4: "Golpe plano y explosivo; máxima potencia sin spin, línea recta.",
        5: "Extensión completa del brazo; termina firme con pala controlada.",
        6: "Rota cadera y hombros; regresa rápido o avanza a cubrir red.",
        7: "Contacta en punto alto frontal; evita impactos laterales."
    },
    "Volea de derecha": {
        0: "Pala lista antes del bote; preparación corta y anticipada.",
        1: "Peso adelante hacia la red; bloquea movimiento con cuerpo.",
        2: "Piernas flexionadas y activas; ajusta con pasos cortos; rodillas preparadas.",
        3: "Contacta pelota delante del cuerpo hacia lado derecho; control máximo.",
        4: "Bloquea pala en impacto; movimiento es principalmente de defensa y control.",
        5: "Termina con pala alta y firme; muñeca bloqueada sin movimiento excesivo.",
        6: "Paso adelante y bloqueo; recupera rápido a posición de volea.",
        7: "Impacta frente a tu cuerpo; mantén la pala firme al contacto."
    },
    "Volea de derecha baja": {
        0: "Pala baja y lista; preparación corta; anticipación crítica cerca de la red.",
        1: "Peso adelante; pequeño paso para acercarse a red si es posible.",
        2: "Rodillas flexionadas; levanta desde piernas, no desde brazos; movimiento ascendente.",
        3: "Contacta lo más alto posible antes del piso; anticipación es fundamental.",
        4: "Levanta suavemente; movimiento ascendente controlado; sin fuerza excesiva.",
        5: "Extiende brazo delantero; termina pala ligeramente arriba del punto de impacto.",
        6: "Permanece en red; recupera posición activa para siguiente golpe.",
        7: "Mantén contacto bajo; la pala debe estar más baja que la red."
    },
    "Volea de reves": {
        0: "Pala atrás con dos manos; codo delante para control; preparación anticipada.",
        1: "Peso adelante; bloquea con tronco completo; paso decisivo hacia red.",
        2: "Piernas flexionadas; pasos cortos activos; ajusta posición constantemente.",
        3: "Contacta delante del cuerpo; ligeramente al lado del brazo no dominante.",
        4: "Bloquea muñeca; movimiento es principal de defensa y control.",
        5: "Termina con pala alta; ambos brazos controlados en extensión.",
        6: "Paso adelante; recupera posición de volea central tras contacto.",
        7: "Mantén la pala en línea central; contacta en zona neutral del cuerpo."
    },
    "Volea de reves baja": {
        0: "Pala baja con dos manos; preparación corta; máxima anticipación.",
        1: "Peso adelante; acércate a la red si es posible; posición dominante.",
        2: "Rodillas flexionadas; levanta desde piernas con movimiento ascendente.",
        3: "Contacta lo más alto posible; anticipación absoluta antes de que baje.",
        4: "Levanta suavemente; movimiento controlado; toque delicado.",
        5: "Extiende ambos brazos; termina pala arriba del punto de impacto.",
        6: "Permanece en red preparada; lista para próximo golpe; recuperación activa.",
        7: "Ambas manos colaboran en levantamiento; muñeca no dominante firme."
    },
    "derecha": {
        0: "Abre hombros; carga pala atrás; armado completo con tiempo de reacción.",
        1: "Carga peso en pierna trasera; transfiere adelante; rota cadera y hombro.",
        2: "Flexiona y extiende piernas; caderas generan potencia base.",
        3: "Contacta delante del cuerpo; punto de impacto determina precisión y control.",
        4: "Swing fluido; impacto es golpe plano o con textura según intención.",
        5: "Acompaña hacia adelante; termina arriba con pala estabilizada.",
        6: "Rota completamente; recupera posición base con pasos controlados.",
        7: "Impacta en zona óptima delante del cuerpo; lado dominante."
    },
    "reves": {
        0: "Carga con dos manos hacia atrás; abre hombro no dominante; armado temprano.",
        1: "Carga peso en pierna trasera; impulsa adelante; rota caderas.",
        2: "Flexiona y extiende piernas; caderas y tronco generan potencia.",
        3: "Coloca pie izquierdo adelante (diestro); contacta ligeramente adelantado.",
        4: "Extiende ambos brazos; movimiento fluido del revés.",
        5: "Termina arriba; estabiliza cara de pala; ambos brazos extendidos.",
        6: "Rota completamente; recupera posición base con pasos cortos.",
        7: "Contacta en zona neutra delante del cuerpo; lado no dominante."
    },
    "derecha con pared": {
        0: "Prepara rápidamente aprovechando espacio en pared; pala en posición.",
        1: "Ajusta peso al bote de pared; golpe defensivo medido.",
        2: "Piernas activas para ajuste rápido; flexibilidad para cambiar posición.",
        3: "Contacta en punto óptimo de bote de pared; anticipación crítica.",
        4: "Golpe de ajuste; bloquea muñeca; controla dirección.",
        5: "Acompaña controladamente; termina golpe de ajuste con técnica.",
        6: "Recupera posición rápidamente tras pared; listo para siguiente bola.",
        7: "Contacta en zona segura con pared; mantén control bajo."
    },
    "reves con pared": {
        0: "Prepara con tiempo; aprovecha rebote de pared; dos manos en posición.",
        1: "Ajusta peso al rebote; transferencia medida y controlada.",
        2: "Piernas activas; flexibilidad para reaccionar al bote.",
        3: "Posiciónate respecto a pared; contacta en buen punto de bote.",
        4: "Golpe de ajuste de revés; bloquea y controla dirección.",
        5: "Acompaña con control; termina golpe técnico de ajuste.",
        6: "Recupera posición rápidamente; listo para siguiente movimiento.",
        7: "Mantén contacto firme contra la pared; zona de contacto controlada."
    },
    "bajada de derecha": {
        0: "Prepara pala arriba; troleo alto para descenso controlado.",
        1: "Carga peso controladamente; descenso medido.",
        2: "Flexiona piernas; usa piernas para control del descenso.",
        3: "Contacta pelota en caída natural hacia abajo; sin forzar punto.",
        4: "Golpe suave y controlado de descenso; toque delicado.",
        5: "Termina con pala controlada; no quiebres el movimiento.",
        6: "Mantén posición defensiva; recupera rápido tras bajada.",
        7: "Contacta en punto bajo controlado; mantén pala firme."
    },
    "bajada de reves": {
        0: "Prepara de revés; troleo en descenso; dos manos en posición.",
        1: "Carga peso controladamente; golpe medido de descenso.",
        2: "Flexiona piernas; usa piernas en descenso controlado.",
        3: "Contacta pelota en caída natural; punto de impacto controlado.",
        4: "Levanta suavemente desde las piernas; toque delicado de revés.",
        5: "Termina controlada; muñeca firme sin ruptura de movimiento.",
        6: "Mantén posición defensiva; recupera rápido tras bajada.",
        7: "Contacta en punto bajo neutro; mantén posición equilibrada."
    }
}

DEFAULT_FALLBACK = {
    0: "Mejora tu armado y preparación; tómate tiempo antes de golpear.",
    1: "Carga peso correctamente; la potencia viene de abajo hacia arriba.",
    2: "Usa piernas y caderas; generan potencia base de todos los golpes.",
    3: "Contacta la pelota en punto óptimo; anticipación es fundamental.",
    4: "Ajusta tu tipo de golpe según la situación; técnica correcta por escenario.",
    5: "Acompaña el golpe; la finalización es parte del control.",
    6: "Recupera posición rápidamente; la recuperación es tan importante como el golpe.",
    7: "Posiciona correctamente el contacto; punto de impacto es fundamental en la técnica."
}
