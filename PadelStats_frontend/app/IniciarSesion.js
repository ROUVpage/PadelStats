import React, { useEffect, useState, useRef } from "react";
import { View, Text, Platform, SafeAreaView, FlatList, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, Alert, Animated, Easing } from "react-native";
import * as Notifications from 'expo-notifications';
import useCronometro from "./cronómetro";
import axios from 'axios';
import { colors, globalStyles } from '../styles/theme';
import { getDeviceId } from '../utils/getDeviceId';
import { Picker } from '@react-native-picker/picker';

// Catálogo remoto de consejos técnicos guardado en backend
let cachedCatalogo = null;

// Configurar notificaciones para Expo
useEffect(() => {
  (async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'No se pueden mostrar notificaciones.');
    }
  })();
}, []);

const BluetoothReceiver = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [inSesion, setInSesion] = useState(false);
  const [ID, onChangeID] = useState(null);
  const [receivedData, setReceivedData] = useState([]);
  const [sesion, setSesion] = useState(null);
  const [objects, setObjects] = useState([]);
  const [ultimoGolpe, setUltimoGolpe] = useState(null);
  const [nivelPromedio, setNivelPromedio] = useState(0);
  const [golpesEnSesion, setGolpesEnSesion] = useState(0);
  const tiposGolpe = [
    'Bandeja', 'Vibora', 'Remate liftado', 'Remate plano',
    'Volea de derecha', 'Volea de derecha baja', 'Volea de reves', 'Volea de reves baja',
    'derecha', 'reves', 'derecha con pared', 'reves con pared',
    'bajada de derecha', 'bajada de reves'
  ];

  const erroresCatalogo = [
    'Armado/Preparación',
    'Peso corporal',
    'Flexión de piernas',
    'Punto de impacto',
    'Tipo de golpeo',
    'Terminación corporal',
    'Finalización brazo',
    'Posición de impacto'
  ];

  const [tipo, onChangeTipo] = useState(tiposGolpe[0]);
  const [calidad, onChangeCalidad] = useState(null);
  const [ErrorNoForzado, onChangeError] = useState(null);
  const [tiempo1, onChangeTiempo] = useState(null);
  const [precisionMan, setPrecisionMan] = useState('');
  const [potenciaMan, setPotenciaMan] = useState('');
  const [efectoMan, setEfectoMan] = useState('0');
  const [velocidadMan, setVelocidadMan] = useState('');
  const [exigenciaMan, setExigenciaMan] = useState('');
  const [puntoImpactoMan, setPuntoImpactoMan] = useState('');
  const [tecnicaMan, setTecnicaMan] = useState('');
  const [lesionMan, setLesionMan] = useState('');
  const [consejoError, setConsejoError] = useState(erroresCatalogo[0]);
  const [usuario, setUsuario] = useState({ id: 0 });
  const [catalogoConsejos, setCatalogoConsejos] = useState({ catalogo: {}, fallback: {} });
  const rotateValue = useRef(new Animated.Value(0)).current;
  const {
    iniciarCronometro,
    detenerCronometro,
    obtenerTiempo,
    tiempoTotal
  } = useCronometro();
  const [tiempo, setTiempo] = useState(null);
  const receivedDataRef = useRef(receivedData);

  useEffect(() => {
    receivedDataRef.current = receivedData;
  }, [receivedData]);

  useEffect(() => {
    let interval;
    if (inSesion) {
      interval = setInterval(() => {
        const tiempoArr = obtenerTiempo();
        setTiempo(`${tiempoArr[0]}:${tiempoArr[1]}:${tiempoArr[2]}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inSesion, obtenerTiempo]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const cargarCatalogo = async () => {
      if (cachedCatalogo) {
        setCatalogoConsejos(cachedCatalogo);
        return;
      }
      try {
        const res = await axios.get('http://127.0.0.1:8000/datos/api/catalogo-consejos/');
        cachedCatalogo = res.data;
        setCatalogoConsejos(res.data);
      } catch (err) {
        console.error('No se pudo cargar el catálogo de consejos. Se usarán textos por defecto.', err);
      }
    };

    const initializeBluetooth = async () => {
      if (Platform.OS !== 'web') {
        try {
          const BluetoothSerial = require('react-native-bluetooth-serial-next').default;
          await BluetoothSerial.enable();
          const devices = await BluetoothSerial.list();
          const esp32 = devices.find((device) => device.name === "ESP32_PadelSensor");

          if (esp32) {
            try {
              await BluetoothSerial.connect(esp32.id);
              setIsConnected(true);

              const deviceId = await getDeviceId();
              const usuarios = await axios.get('http://127.0.0.1:8000/datos/api/usuarios/');
              const usuarioEncontrado = usuarios.data.find(
                (s) => s.deviceId === deviceId || s.deviceId1 === deviceId
              );
              setUsuario(usuarioEncontrado || { id: 0 });

              BluetoothSerial.onDataReceived((data) => {
                let parsedData;
                try {
                  parsedData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
                } catch (e) {
                  console.error("❌ Error al parsear JSON:", data.data);
                  return;
                }
                // Solo si recibimos bolaDetectada
                if (parsedData.bolaDetectada !== undefined) {
                  const res = receivedDataRef.current.slice(-8).reverse();
                  let ind = false;
                  res.forEach((dato, i) => {
                    if (dato.bolaDetectada) {
                      ind = i;
                    }
                  });
                  const array = ind !== false ? res.slice(-ind) : res;
                  let object = false;
                  array.forEach((dato) => {
                    if (object) {
                      object = {
                        ...object,
                        pitch: [...object.pitch, dato.pitch],
                        roll: [...object.roll, dato.roll],
                        Yaw: [...object.Yaw, dato.Yaw],
                        DistanciaFrontal: [...object.DistanciaFrontal, dato.DistanciaFrontal],
                        DistanciaLateral: [...object.DistanciaLateral, dato.DistanciaLateral],
                        DistanciaInferior: [...object.DistanciaInferior, dato.DistanciaInferior],
                        AceleraciónX: [...object.AceleraciónX, dato.AceleraciónX],
                        AceleraciónY: [...object.AceleraciónY, dato.AceleraciónY],
                        AceleraciónZ: [...object.AceleraciónZ, dato.AceleraciónZ],
                        VelocidadPala: [...object.VelocidadPala, dato.VelocidadPala],
                        DirecciónGolpe: [...object.DirecciónGolpe, dato.DirecciónGolpe],
                        AlturaRed: [...object.AlturaRed, dato.AlturaRed],
                        VelocidadPelota: [...object.VelocidadPelota, dato.VelocidadPelota],
                        altura: usuario.altura,
                        peso: usuario.peso,
                        manoDominante: usuario.manoDominante,
                        sesionId: sesion.id
                      };
                    } else {
                      object = {
                        pitch: [dato.pitch],
                        roll: [dato.roll],
                        Yaw: [dato.Yaw],
                        DistanciaFrontal: [dato.DistanciaFrontal],
                        DistanciaLateral: [dato.DistanciaLateral],
                        DistanciaInferior: [dato.DistanciaInferior],
                        AceleraciónX: [dato.AceleraciónX],
                        AceleraciónY: [dato.AceleraciónY],
                        AceleraciónZ: [dato.AceleraciónZ],
                        VelocidadPala: [dato.VelocidadPala],
                        DirecciónGolpe: [dato.DirecciónGolpe],
                        AlturaRed: [dato.AlturaRed],
                        VelocidadPelota: [dato.VelocidadPelota],
                        altura: usuario.altura,
                        peso: usuario.peso,
                        manoDominante: usuario.manoDominante,
                        sesionId: sesion.id
                      };
                    }
                  });
                  if (object) {
                    const func = async () => {
                      const res = await axios.get('http://127.0.0.1:8000/datos/api/datosSensor/');
                      await axios.put('http://127.0.0.1:8000/datos/api/datosSensor/', objeto)
                      return res.data
                    }
                    const resultado1 = func();
                    setObjests(resultado1);
                    obtenerPrediccion(object)
                  }
                }
                setReceivedData((prev) => [...prev, { ...parsedData, altura: usuario.altura, peso: usuario.peso, manoDominante: usuario.manoDominante }]);
              });

              console.log("✅ Conectado al ESP32");
            } catch (error) {
              console.error("Error al conectar con el dispositivo:", error);
              Alert.alert(
                "Error de conexión",
                "No se pudo conectar con el sensor Padel Stats. Por favor, asegúrate de que el dispositivo está encendido y cerca.",
                [{ text: "OK" }]
              );
              setIsConnected(false);
            }
          } else {
            console.log("❌ ESP32 no encontrado");
            Alert.alert(
              "Dispositivo no encontrado",
              "No se encontró el sensor Padel Stats. Por favor:\n\n1. Asegúrate de que está encendido\n2. Verifica que el Bluetooth está activado\n3. El dispositivo debe estar cerca",
              [{ text: "OK" }]
            );
            setIsConnected(false);
          }
        } catch (error) {
          console.error("Error al inicializar Bluetooth:", error);
          Alert.alert(
            "Error de Bluetooth",
            "No se pudo inicializar el Bluetooth. Por favor:\n\n1. Activa el Bluetooth en tu dispositivo\n2. Concede los permisos necesarios si se solicitan\n3. Reinicia la aplicación si el problema persiste",
            [{ text: "OK" }]
          );
          setIsConnected(false);
        }
      }
    };

    initializeBluetooth();
    cargarCatalogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotateValue, usuario.altura, usuario.peso, usuario.manoDominante]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const obtenerFechaHoraActual = () => {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const dia = ahora.getDate().toString().padStart(2, '0');
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const segundos = ahora.getSeconds().toString().padStart(2, '0');
    return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
  };

  const crearNotificacionSesion = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Sesión en curso',
        body: `Tiempo: ${tiempo1 || 0}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  };

  const IniciarSesion = async () => {
    if (!isConnected) {
      Alert.alert(
        "Error de conexión",
        "No se puede iniciar la sesión porque el sensor Padel Stats no está conectado. Por favor:\n\n1. Asegúrate de que el dispositivo está encendido\n2. Verifica que el Bluetooth está activado\n3. Mantén el sensor cerca de tu móvil\n4. Pulsa el botón 'Reintentar conexión' abajo",
        [
          { text: "Cancelar" },
          {
            text: "Reintentar conexión",
            onPress: () => {
              const initBluetooth = async () => {
                try {
                  const BluetoothSerial = require('react-native-bluetooth-serial-next').default;
                  await BluetoothSerial.enable();
                  const devices = await BluetoothSerial.list();
                  const esp32 = devices.find((device) => device.name === "ESP32_PadelSensor");
                  if (esp32) {
                    await BluetoothSerial.connect(esp32.id);
                    setIsConnected(true);
                  }
                } catch (error) {
                  console.error("Error al reintentar conexión:", error);
                }
              };
              initBluetooth();
            }
          }
        ]
      );
      return;
    }
    setInSesion(true);
    const time = obtenerFechaHoraActual();
    iniciarCronometro();
    crearNotificacionSesion();
    setGolpesEnSesion(0);
    setNivelPromedio(0);
    setUltimoGolpe(null);
    try {
      const sesion = await axios.post('http://127.0.0.1:8000/datos/api/sesiones/', { fecha: time });
      setSesion(sesion.data);
    } catch (error) {
      console.error("Error al crear la sesión:", error);
      Alert.alert(
        "Error",
        "No se pudo iniciar la sesión. Por favor, inténtalo de nuevo.",
        [{ text: "OK" }]
      );
      setInSesion(false);
      detenerCronometro();
    }
  };
  const finalizarSesion = async () => {
    const fechaActual = obtenerFechaHoraActual();
    setInSesion(false);
    await Notifications.cancelAllScheduledNotificationsAsync();
    const datosIA = await axios.get('http://127.0.0.1:8000/datos/api/datosIA/');
    
    // Variables para mejor y peor golpe según la nueva estructura
    let mejorGolpe = null;
    let peorGolpe = null;
    let mejorMedia = 0;
    let peorMedia = Infinity;

    const datosFiltrados = datosIA.data.filter((dato) => dato.sesionId === sesion.id);
    
    // Calcular mejor y peor golpe basado en la media de técnica, punto de impacto, potencia y precisión
    datosFiltrados.forEach((dato) => {
      const mediaGolpe = (dato.tecnica + dato.puntoImpacto + dato.potencia + dato.precision) / 4;
      
      if (mediaGolpe > mejorMedia) {
        mejorMedia = mediaGolpe;
        mejorGolpe = dato;
      }
      
      if (mediaGolpe < peorMedia) {
        peorMedia = mediaGolpe;
        peorGolpe = dato;
      }
    });

    // Calcular estadísticas generales
    let exigenciaFisicaTotal = 0;
    let velocidadMaxima = 0;
    let posibilidadLesionTotal = 0;
    
    datosFiltrados.forEach((dato) => {
      exigenciaFisicaTotal += dato.exigenciaFisica || 0;
      if (dato.velocidadBola > velocidadMaxima) {
        velocidadMaxima = dato.velocidadBola;
      }
      posibilidadLesionTotal += dato.posibilidadLesion || 0;
    });

    const numGolpes = datosFiltrados.length;
    const exigenciaFisicaMedia = numGolpes > 0 ? exigenciaFisicaTotal / numGolpes : 0;
    const posibilidadLesionMedia = numGolpes > 0 ? posibilidadLesionTotal / numGolpes : 0;

    await axios.put(`http://127.0.0.1:8000/datos/api/sesiones/${sesion.id}/`, {
      ...sesion,
      fecha: fechaActual,
      duracion: tiempoTotal,
      numGolpes: numGolpes,
      mejorGolpe: mejorGolpe?.tipo || '',
      mejorGolpeTecnica: mejorGolpe?.tecnica || 0,
      mejorGolpePrecision: mejorGolpe?.precision || 0,
      mejorGolpePotencia: mejorGolpe?.potencia || 0,
      mejorGolpePuntoImpacto: mejorGolpe?.puntoImpacto || 0,
      peorGolpe: peorGolpe?.tipo || '',
      peorGolpeTecnica: peorGolpe?.tecnica || 0,
      peorGolpePrecision: peorGolpe?.precision || 0,
      peorGolpePotencia: peorGolpe?.potencia || 0,
      peorGolpePuntoImpacto: peorGolpe?.puntoImpacto || 0,
      exigenciaFisicaMedia: exigenciaFisicaMedia,
      velocidadBolaMaxima: velocidadMaxima,
      posibilidadLesionMedia: posibilidadLesionMedia,
    });

    // Recalcular frecuencia de errores por tipo de golpe al cierre de sesión
    try {
      const resGolpes = await axios.get('http://127.0.0.1:8000/datos/api/datosIA/');
      const golpesSesion = resGolpes.data.filter((g) => g.idSesión === sesion.id);

      // Agrupar por tipo
      const golpesPorTipo = golpesSesion.reduce((acc, g) => {
        acc[g.tipo] = acc[g.tipo] || [];
        acc[g.tipo].push(g);
        return acc;
      }, {});

      const nivelFrecuencia = (count, total) => {
        const ratio = total > 0 ? count / total : 0;
        if (ratio >= 0.65) return '85% error muy común';
        if (ratio >= 0.4) return '65% error bastante común';
        return null; // <40% no se muestra
      };

      for (const tipo in golpesPorTipo) {
        const lista = golpesPorTipo[tipo];
        const totalTipo = lista.length;

        // Contar ocurrencias por error
        const conteoErrores = {};
        lista.forEach((g) => {
          (g.consejosTecnicos || []).forEach((c) => {
            conteoErrores[c.error] = (conteoErrores[c.error] || 0) + 1;
          });
        });

        // Calcular nivel y filtrar <40%
        const nivelesPorError = {};
        Object.entries(conteoErrores).forEach(([error, count]) => {
          const nivel = nivelFrecuencia(count, totalTipo);
          if (nivel) {
            nivelesPorError[error] = nivel;
          }
        });

        // Actualizar cada golpe con niveles finales y erroresComunes filtrados
        for (const golpe of lista) {
          const nuevosConsejos = (golpe.consejosTecnicos || [])
            .map((c) => {
              const nivel = nivelesPorError[c.error];
              if (!nivel) return null; // descartar <40%
              return { ...c, nivel };
            })
            .filter(Boolean);

          const erroresComunes = nuevosConsejos.map((c) => `${c.nivel} - ${c.error}`);

          await axios.put(`http://127.0.0.1:8000/datos/api/datosIA/${golpe.id}/`, {
            ...golpe,
            consejosTecnicos: nuevosConsejos,
            erroresComunes,
          });
        }
      }
    } catch (err) {
      console.error('No se pudo recalcular frecuencia de errores al cerrar sesión', err);
    }

    detenerCronometro();
  }

  const construirConsejosTecnicos = (prediccion) => {
    // La predicción SIEMPRE debe venir del backend con consejos_tecnicos (Top-K)
    // La IA predice TODO - no se deduce nada basado en métricas
    if (prediccion.consejos_tecnicos && prediccion.consejos_tecnicos.length > 0) {
      const consejos = prediccion.consejos_tecnicos.map(criterio => ({
        error: `${criterio.criterio_nombre} (${criterio.porcentaje})`,
        consejo: criterio.consejo,
        nivel: 'pendiente',
        probabilidad: criterio.probabilidad
      }));
      return { consejos, erroresComunes: [] };
    }

    // Si no hay consejos_tecnicos, es un error - la IA debe predecir siempre
    console.error('ADVERTENCIA: prediccion sin consejos_tecnicos. La IA debe predecir todos los errores.');
    return { consejos: [], erroresComunes: [] };
  };

  const enviarYEntrenar = async (golpe) => {
    try {
      if (!usuario.es_entrenador) {
        Alert.alert('No autorizado', 'Solo entrenadores pueden enviar golpes para entrenamiento');
        return;
      }

      // X: usamos el golpe crudo si llega, si no, vector de ceros 50x10
      const X = golpe?.matriz || Array.from({ length: 50 }, () => Array(10).fill(0));

      // y manual: parsear campos
      const tipoIdx = tiposGolpe.indexOf(tipo);
      const efectoIdx = parseInt(efectoMan || '0', 10);
      const consejoErrorIdx = erroresCatalogo.indexOf(consejoError);

      const payload = {
        user_id: usuario.id,
        X,
        y: {
          tipo_golpe: tipoIdx < 0 ? 0 : tipoIdx,
          precision: Number(precisionMan) || 0,
          potencia: Number(potenciaMan) || 0,
          efecto: isNaN(efectoIdx) ? 0 : efectoIdx,
          velocidadBola: Number(velocidadMan) || 0,
          exigenciaFisica: Number(exigenciaMan) || 0,
          puntoImpacto: Number(puntoImpactoMan) || 0,
          tecnica: Number(tecnicaMan) || 0,
          posibilidadLesion: Number(lesionMan) || 0,
        },
        consejo_error_idx: consejoErrorIdx < 0 ? 0 : consejoErrorIdx,
      };

      const res = await axios.post('http://127.0.0.1:8000/datos/api/entrenar-golpe/', payload);
      Alert.alert('Entrenado', res.data.mensaje || 'Golpe entrenado');

    } catch (error) {
      console.error("❌ Error:", error);
      Alert.alert('Error', 'No se pudo entrenar el golpe');
    }
  };

  const eliminar = (golpe) => {
    setObjects(objects.filter((dato) => dato !== golpe))
  }

  const obtenerPrediccion = async (objeto) => {
    try {
      // Si hay datos reales del sensor, llamar al endpoint de predicción real
      if (objeto && objeto.matriz && objeto.matriz.length > 0) {
        try {
          const response = await axios.post('http://127.0.0.1:8000/datos/api/predecir-golpe-ia/', {
            X: objeto.matriz
          });

          if (response.data.success) {
            const pred = response.data;
            
            // Construir predicción con el formato esperado
            const prediccion = {
              tipo: pred.tipo_golpe,
              precision: pred.precision,
              potencia: pred.potencia,
              efecto: ['plano', 'cortado', 'liftado'][pred.efecto_idx] || 'plano',
              velocidadBola: pred.velocidadBola,
              exigenciaFisica: pred.exigenciaFisica,
              puntoImpacto: pred.puntoImpacto,
              tecnica: pred.tecnica,
              posibilidadLesion: pred.posibilidadLesion,
              consejos_tecnicos: pred.consejos_tecnicos, // Array con Top-K criterios
              idSesión: sesion?.id || 0,
              tiempo: tiempo || '00:00:00'
            };

            const { consejos, erroresComunes } = await construirConsejosTecnicos(prediccion);
            const prediccionConConsejos = {
              ...prediccion,
              consejosTecnicos: consejos,
              erroresComunes
            };
            
            // Actualizar feedback en tiempo real
            const nivel = (pred.tecnica + pred.precision + pred.potencia + pred.puntoImpacto) / 4;
            setGolpesEnSesion(prev => prev + 1);
            setNivelPromedio(prev => (prev * (golpesEnSesion) + nivel) / (golpesEnSesion + 1));
            setUltimoGolpe({
              tipo: pred.tipo_golpe,
              nivel: nivel.toFixed(1),
              timestamp: new Date()
            });
            
            // Guardar en la base de datos
            await axios.post('http://127.0.0.1:8000/datos/api/datosIA/', prediccionConConsejos);
            
            return prediccionConConsejos;
          }
        } catch (apiError) {
          console.error('Error al obtener predicción de IA, usando valores simulados:', apiError);
        }
      }

      // Fallback: Simular predicción con valores aleatorios si no hay datos reales del sensor
      // SOLO para modo simulación - en producción esto no debe ejecutarse
      const tiposGolpe = ['Derecha', 'Reves', 'Volea', 'Remate'];
      const efectos = ['plano', 'cortado', 'liftado'];
      const criteriosTecnicos = [
        'Armado/Preparación',
        'Peso corporal',
        'Flexión de piernas',
        'Punto de impacto',
        'Tipo de golpeo',
        'Terminación corporal',
        'Finalización brazo',
        'Posición de impacto'
      ];
      
      // Generar predicción simulada con consejos_tecnicos simulados (Top-3 aleatorios)
      const tipoSimulado = tiposGolpe[Math.floor(Math.random() * tiposGolpe.length)];
      const consejosSimulados = [];
      const criteriosUsados = new Set();
      
      // Generar 1-3 consejos aleatorios
      const numConsejos = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numConsejos; i++) {
        let criterioIdx;
        do {
          criterioIdx = Math.floor(Math.random() * 8);
        } while (criteriosUsados.has(criterioIdx));
        
        criteriosUsados.add(criterioIdx);
        const prob = 0.3 + Math.random() * 0.6; // 30%-90%
        
        consejosSimulados.push({
          criterio_idx: criterioIdx,
          criterio_nombre: criteriosTecnicos[criterioIdx],
          probabilidad: prob,
          porcentaje: `${(prob * 100).toFixed(1)}%`,
          consejo: catalogoConsejos.catalogo?.[tipoSimulado]?.[criteriosTecnicos[criterioIdx]] || 
                   'Ajusta técnica y equilibrio para mejorar este patrón.'
        });
      }
      
      const prediccion = {
        tipo: tipoSimulado,
        precision: Math.floor(Math.random() * 10) + 1,
        potencia: Math.floor(Math.random() * 10) + 1,
        efecto: efectos[Math.floor(Math.random() * efectos.length)],
        velocidadBola: (Math.random() * 80 + 40).toFixed(1),
        exigenciaFisica: Math.floor(Math.random() * 10) + 1,
        puntoImpacto: Math.floor(Math.random() * 5) + 1,
        tecnica: Math.floor(Math.random() * 10) + 1,
        posibilidadLesion: Math.floor(Math.random() * 5) + 1,
        consejos_tecnicos: consejosSimulados, // Array simulado con Top-K
        idSesión: sesion?.id || 0,
        tiempo: tiempo || '00:00:00'
      };

      const { consejos, erroresComunes } = await construirConsejosTecnicos(prediccion);
      const prediccionConConsejos = {
        ...prediccion,
        consejosTecnicos: consejos,
        erroresComunes
      };
      
      // Guardar en la base de datos
      await axios.post('http://127.0.0.1:8000/datos/api/datosIA/', prediccionConConsejos);
      
      return prediccionConConsejos;
    } catch (error) {
      console.error("Error al obtener predicción:", error);
      return null;
    }
  };
  // Dropdown para seleccionar solo sesiones presentes en objects
  const [sesionesDisponibles, setSesionesDisponibles] = useState([]);
  const [sesionesCargadas, setSesionesCargadas] = useState(false);

  // Solo mostrar sesiones que están en objects
  useEffect(() => {
    // Obtener IDs únicos de sesiones en objects
    const sesionesEnObjects = Array.from(
      new Set(objects.map(obj => obj.sesionId).filter(Boolean))
    );
    setSesionesDisponibles(sesionesEnObjects);
  }, [objects]);

  const esTrainer = usuario?.es_entrenador;

  return esTrainer ? (!inSesion ? (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.content}>
        <Pressable
          style={globalStyles.button}
          onPress={IniciarSesion}
        >
          <Text style={globalStyles.buttonText}>Iniciar Sesión</Text>
        </Pressable>

        <Text style={[globalStyles.subtitle, styles.connectionStatus]}>
          Estado de conexión:
          <Text style={{ color: isConnected ? '#2ECC71' : '#E74C3C' }}>
            {isConnected ? " Conectado" : " Desconectado"}
          </Text>
        </Text>

        <View>
          <Text>Analizar</Text>
          {/* Dropdown de sesiones */}
          <View style={{ marginVertical: 12 }}>
            <Text style={{ marginBottom: 4 }}>Selecciona una sesión:</Text>
            <View style={[styles.cell, { padding: 0 }]}>
              <Picker
                selectedValue={ID}
                onValueChange={onChangeID}
                style={{ flex: 1, height: 50 }}
              >
                <Picker.Item label="Selecciona una sesión" value={null} />
                {sesionesDisponibles.map((sesionId) => (
                  <Picker.Item key={sesionId} label={`Sesión ${sesionId}`} value={String(sesionId)} />
                ))}
              </Picker>
            </View>
          </View>

          <FlatList
            data={objects.slice(-1).reverse().filter((objeto) => String(objeto.sesionId) === String(ID))}
            renderItem={({ item }) =>
              <ScrollView style={globalStyles.card}>
                <View style={styles.tableHeader}>
                  <Text style={[globalStyles.subtitle, styles.headerCell]}>Etiquetas para Entrenamiento</Text>
                </View>
                <View style={styles.tableContent}>
                  <Picker selectedValue={tipo} onValueChange={onChangeTipo} style={{ marginVertical: 8 }}>
                    {tiposGolpe.map((t) => (
                      <Picker.Item key={t} label={t} value={t} />
                    ))}
                  </Picker>
                  <TextInput style={styles.cell} placeholder="Precisión" keyboardType="numeric" value={precisionMan} onChangeText={setPrecisionMan} />
                  <TextInput style={styles.cell} placeholder="Potencia" keyboardType="numeric" value={potenciaMan} onChangeText={setPotenciaMan} />
                  <TextInput style={styles.cell} placeholder="Velocidad bola" keyboardType="numeric" value={velocidadMan} onChangeText={setVelocidadMan} />
                  <TextInput style={styles.cell} placeholder="Exigencia física" keyboardType="numeric" value={exigenciaMan} onChangeText={setExigenciaMan} />
                  <TextInput style={styles.cell} placeholder="Punto de impacto" keyboardType="numeric" value={puntoImpactoMan} onChangeText={setPuntoImpactoMan} />
                  <TextInput style={styles.cell} placeholder="Técnica" keyboardType="numeric" value={tecnicaMan} onChangeText={setTecnicaMan} />
                  <TextInput style={styles.cell} placeholder="Posibilidad lesión" keyboardType="numeric" value={lesionMan} onChangeText={setLesionMan} />
                  <Picker selectedValue={efectoMan} onValueChange={setEfectoMan} style={{ marginVertical: 8 }}>
                    <Picker.Item label="Efecto: plano (0)" value="0" />
                    <Picker.Item label="Efecto: cortado (1)" value="1" />
                    <Picker.Item label="Efecto: liftado (2)" value="2" />
                  </Picker>
                  <Picker selectedValue={consejoError} onValueChange={setConsejoError} style={{ marginVertical: 8 }}>
                    {erroresCatalogo.map((e) => (
                      <Picker.Item key={e} label={`Consejo/Error: ${e}`} value={e} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.actionButtons}>
                  <Pressable
                    style={[globalStyles.button, styles.actionButton]}
                    onPress={() => enviarYEntrenar(item)}
                  >
                    <Text style={globalStyles.buttonText}>Enviar datos</Text>
                  </Pressable>
                  <Pressable
                    style={[globalStyles.button, styles.actionButton, styles.deleteButton]}
                    onPress={() => eliminar(item)}
                  >
                    <Text style={globalStyles.buttonText}>Eliminar</Text>
                  </Pressable>
                </View>
              </ScrollView>
            }
            keyExtractor={item => item.id}
          />
        </View>
      </View>
    </SafeAreaView>
  ) : (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.analysingContainer}>
        <Text style={globalStyles.title}>Analizando</Text>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={[globalStyles.subtitle, styles.timer]}>{tiempo}</Text>
        <Pressable
          style={[globalStyles.button, styles.finishButton]}
          onPress={finalizarSesion}
        >
          <Text style={globalStyles.buttonText}>Finalizar Sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )) : (!inSesion ? (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView style={styles.content}>
        <View style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>Enciende el Padel Stats</Text>
          <Text style={[globalStyles.body, styles.instruction]}>
            Presiona el botón de la parte inferior del dispositivo
          </Text>
        </View>

        <View style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>Conecta el Padel Stats</Text>
          <Text style={[globalStyles.body, styles.instruction]}>
            Debes tener el bluetooth activado para que se pueda conectar correctamente a tu dispositivo
          </Text>
        </View>

        <View style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>Inicia la Sesión</Text>
          <Text style={[globalStyles.body, styles.instruction]}>
            Pulsa el botón inferior para comenzar tu sesión de entrenamiento
          </Text>
        </View>

        <Pressable
          style={[globalStyles.button, styles.startButton]}
          onPress={IniciarSesion}
        >
          <Text style={globalStyles.buttonText}>Iniciar Sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  ) : (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.analysingContainer}>
        <Text style={globalStyles.title}>Analizando</Text>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={[globalStyles.subtitle, styles.timer]}>{tiempo}</Text>
        
        {/* Feedback en tiempo real */}
        {ultimoGolpe && (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackTitulo}>Último Golpe</Text>
            <Text style={styles.feedbackGolpe}>{ultimoGolpe.tipo}</Text>
            <Text style={styles.feedbackNivel}>Nivel: {ultimoGolpe.nivel}/10</Text>
            <Text style={styles.feedbackPromedio}>Promedio: {nivelPromedio.toFixed(1)}/10</Text>
            <Text style={styles.feedbackGolpes}>Golpes: {golpesEnSesion}</Text>
          </View>
        )}
        
        <Pressable
          style={[globalStyles.button, styles.finishButton]}
          onPress={finalizarSesion}
        >
          <Text style={globalStyles.buttonText}>Finalizar Sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  ));
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  connectionStatus: {
    marginVertical: 16,
  }, tableHeader: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCell: {
    textAlign: 'center',
  },
  tableContent: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  }, analysingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  timer: {
    marginVertical: 32,
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  finishButton: {
    width: '100%',
    marginTop: 32,
  },
  feedbackBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  feedbackTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  feedbackGolpe: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 8,
  },
  feedbackNivel: {
    fontSize: 16,
    color: '#1976D2',
    marginBottom: 4,
    fontWeight: '600',
  },
  feedbackPromedio: {
    fontSize: 16,
    color: '#1976D2',
    marginBottom: 4,
    fontWeight: '600',
  },
  feedbackGolpes: {
    fontSize: 14,
    color: '#1565C0',
  },
  instruction: {
    marginTop: 12,
    color: '#7F8C8D',
  },
  startButton: {
    marginTop: 32,
  }, cell: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    fontSize: 16,
    color: '#2C3E50',
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    marginHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sessionText: {
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  timeText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  errorMessage: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 8,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
});

export default BluetoothReceiver;
