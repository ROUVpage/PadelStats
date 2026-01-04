import axios from 'axios';

// Configuración base para la web
const WEB_API_BASE = 'http://127.0.0.1:8000/api';

/**
 * Obtener todos los pedidos del último mes
 */
export const getOrdenesMes = async () => {
  try {
    const response = await axios.get(`${WEB_API_BASE}/orders/`);
    const ahora = new Date();
    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return response.data.filter(orden => {
      const fechaOrden = new Date(orden.fecha);
      return fechaOrden >= hace30Dias;
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return [];
  }
};

/**
 * Obtener datos de ventas agrupadas por día
 */
export const getVentasPorDia = async () => {
  try {
    const ordenes = await getOrdenesMes();
    const ventasPorDia = {};

    ordenes.forEach(orden => {
      const fecha = new Date(orden.fecha);
      const dia = fecha.getDate();
      ventasPorDia[dia] = (ventasPorDia[dia] || 0) + 1;
    });

    return Object.entries(ventasPorDia).map(([dia, cantidad]) => ({
      fecha: `Día ${dia}`,
      valor: cantidad
    }));
  } catch (error) {
    console.error('Error al obtener ventas por día:', error);
    return [];
  }
};

/**
 * Obtener distribución de compradores por provincia
 */
export const getCompradorPorProvincia = async () => {
  try {
    const ordenes = await getOrdenesMes();
    const provincias = {};

    ordenes.forEach(orden => {
      const provincia = orden.provincia || 'Desconocida';
      provincias[provincia] = (provincias[provincia] || 0) + 1;
    });

    return Object.entries(provincias).map(([provincia, cantidad]) => ({
      provincia,
      valor: cantidad
    }));
  } catch (error) {
    console.error('Error al obtener compradores por provincia:', error);
    return [];
  }
};

/**
 * Calcular totales del mes
 */
export const getTotalesMes = async () => {
  try {
    const ordenes = await getOrdenesMes();
    
    let totalDinero = 0;
    ordenes.forEach(orden => {
      totalDinero += parseFloat(orden.total) || 0;
    });

    return {
      totalOrdenes: ordenes.length,
      totalDinero,
      ordenes
    };
  } catch (error) {
    console.error('Error al obtener totales:', error);
    return {
      totalOrdenes: 0,
      totalDinero: 0,
      ordenes: []
    };
  }
};

/**
 * Obtener detalles de una orden específica
 */
export const getOrdenDetalle = async (ordenId) => {
  try {
    const response = await axios.get(`${WEB_API_BASE}/orders/${ordenId}/`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles de orden:', error);
    return null;
  }
};
