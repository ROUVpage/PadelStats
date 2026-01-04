import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [sesionActual, setSesionActual] = useState(null);
  const [datosIA, setDatosIA] = useState([]);

  // Memoizar funciones de utilidad
  const fetchUsuario = async () => {
    try {
      const deviceId = await DeviceInfo.getUniqueId();
      const res = await axios.get('http://127.0.0.1:8000/datos/api/usuarios/');
      const listaUsuarios = res.data;

      const usuarioEncontrado = listaUsuarios.find(
        user => user.deviceId === deviceId || user.deviceId1 === deviceId
      );
      if (usuarioEncontrado) {
        setUsuario(usuarioEncontrado);
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error);
    }
  };

  const obtenerSesiones = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/datos/api/sesiones/');
      return res.data;
    } catch (error) {
      console.error('Error al obtener sesiones:', error);
      return [];
    }
  };

  const obtenerDatosIA = async (sesiones) => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/datos/api/datosIA/');
      const datos = sesiones.map(sesion =>
        res.data.filter(dato => dato.sesionId === sesion.id)
      );
      setDatosIA(datos);
    } catch (error) {
      console.error('Error al obtener datos IA:', error);
    }
  };

  // Memoizar el valor del contexto
  const value = useMemo(() => ({
    usuario,
    setUsuario,
    sesionActual,
    setSesionActual,
    datosIA,
    setDatosIA,
    fetchUsuario,
    obtenerSesiones,
    obtenerDatosIA
  }), [usuario, sesionActual, datosIA]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppProvider');
  }
  return context;
};