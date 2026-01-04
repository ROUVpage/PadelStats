import { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';

const useCronometro = () => {
  const [tiempoTotal, setTiempoTotal] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const iniciarCronometro = useCallback(() => {
    if (!isActive) {
      setIsActive(true);
      startTimeRef.current = Date.now() - (tiempoTotal * 1000);
      intervalRef.current = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTiempoTotal(elapsedTime);
      }, 1000);
    }
  }, [isActive, tiempoTotal]);

  const detenerCronometro = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      startTimeRef.current = null;
    }
    setIsActive(false);
  }, []);

  const reiniciarCronometro = useCallback(() => {
    detenerCronometro();
    startTimeRef.current = null;
    setTiempoTotal(0);
  }, [detenerCronometro]);

  const obtenerTiempo = useCallback(() => {
    if (!isActive && !startTimeRef.current) {
      return ['00', '00', '00'];
    }
    const horas = Math.floor(tiempoTotal / 3600);
    const minutos = Math.floor((tiempoTotal % 3600) / 60);
    const segundos = tiempoTotal % 60;

    return [
      horas.toString().padStart(2, '0'),
      minutos.toString().padStart(2, '0'),
      segundos.toString().padStart(2, '0')
    ];
  }, [tiempoTotal, isActive]);

  const obtenerTiempoFormateado = useCallback(() => {
    const [horas, minutos, segundos] = obtenerTiempo();
    return `${horas}:${minutos}:${segundos}`;
  }, [obtenerTiempo]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    tiempoTotal,
    isActive,
    iniciarCronometro,
    detenerCronometro,
    reiniciarCronometro,
    obtenerTiempo,
    obtenerTiempoFormateado
  };
};

const styles = StyleSheet.create({
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  labelText: {
    fontSize: 16,
    color: '#7F8C8D', 
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
});

export default useCronometro;
