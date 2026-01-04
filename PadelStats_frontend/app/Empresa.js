import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, ScrollView, SafeAreaView, StyleSheet, Platform, TextInput, Pressable } from 'react-native';
import GraficoGolpes from './graficaGolpes';
import { globalStyles } from '../styles/theme';
import { getTotalesMes, getVentasPorDia, getCompradorPorProvincia } from '../utils/ordenesService';

const Empresa = () => {
  const [ventasData, setVentasData] = useState([]);
  const [provinciasData, setProvinciasData] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [dineroGenerado, setDineroGenerado] = useState(0);
  const [marketingCostes, setMarketingCostes] = useState('0');
  const [extrasCostes, setExtrasCostes] = useState('0');
  const [beneficioBruto, setBeneficioBruto] = useState(0);
  const [porcentajeBeneficio, setPorcentajeBeneficio] = useState(0);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [gastosEnvioTotal, setGastosEnvioTotal] = useState(0);

  const COSTO_PRODUCTO = 35.84;

  useEffect(() => {
    cargarDatosVentas();
  }, []);

  const cargarDatosVentas = async () => {
    try {
      // Obtener datos usando los servicios
      const totales = await getTotalesMes();
      const ventas = await getVentasPorDia();
      const provincias = await getCompradorPorProvincia();

      setPedidos(totales.ordenes);
      setVentasData(ventas);
      setProvinciasData(provincias);
      setTotalVentas(totales.totalOrdenes);
      setDineroGenerado(totales.totalDinero);

      // Calcular gasto de envío total real
      let gastoEnvioTotal = 0;
      totales.ordenes.forEach(pedido => {
        gastoEnvioTotal += parseFloat(pedido.gasto_envio) || 0;
      });
      setGastosEnvioTotal(gastoEnvioTotal);

      // Calcular beneficio bruto con gasto envío real
      calcularBeneficio(totales.totalDinero, parseFloat(marketingCostes) || 0, parseFloat(extrasCostes) || 0, totales.totalOrdenes, gastoEnvioTotal);
    } catch (error) {
      console.error('Error al obtener datos de ventas:', error);
    }
  };

  const calcularBeneficio = (dinero, marketing, extras, numPedidos, gastoEnvioReal) => {
    const costoTotal = COSTO_PRODUCTO * numPedidos;
    const gastosTotales = costoTotal + gastoEnvioReal + marketing + extras;
    const beneficio = dinero - gastosTotales;
    const porcentaje = dinero > 0 ? (beneficio / dinero) * 100 : 0;

    setBeneficioBruto(beneficio);
    setPorcentajeBeneficio(porcentaje);
  };

  const actualizarCostes = () => {
    calcularBeneficio(dineroGenerado, parseFloat(marketingCostes) || 0, parseFloat(extrasCostes) || 0, totalVentas, gastosEnvioTotal);
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={globalStyles.title}>Panel de Empresa</Text>

        {/* SECCIÓN 1: VENTAS */}
        <View style={styles.section}>
          <Text style={globalStyles.subtitle}>Ventas - Último Mes</Text>
          
          {ventasData.length > 0 && (
            <View style={globalStyles.card}>
              <GraficoGolpes datos={ventasData} tipoGrafica={'calidad'} />
            </View>
          )}

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Ventas</Text>
              <Text style={styles.statValue}>{totalVentas}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Dinero Generado</Text>
              <Text style={styles.statValue}>€{dineroGenerado.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN 2: COSTES Y BENEFICIO */}
        <View style={styles.section}>
          <Text style={globalStyles.subtitle}>Costes y Beneficio</Text>

          <View style={styles.costesContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Costes Marketing (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="decimal-pad"
                value={marketingCostes}
                onChangeText={setMarketingCostes}
                onEndEditing={actualizarCostes}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Extras Costes (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="decimal-pad"
                value={extrasCostes}
                onChangeText={setExtrasCostes}
                onEndEditing={actualizarCostes}
              />
            </View>
          </View>

          <View style={styles.beneficioBox}>
            <View style={styles.beneficioItem}>
              <Text style={styles.beneficioLabel}>Dinero Generado Total</Text>
              <Text style={[styles.beneficioValue, { color: '#22863A' }]}>€{dineroGenerado.toFixed(2)}</Text>
            </View>

            <View style={styles.beneficioItem}>
              <Text style={styles.beneficioLabel}>Costo Producto (unitario)</Text>
              <Text style={styles.beneficioValue}>€{COSTO_PRODUCTO.toFixed(2)}</Text>
            </View>

            <View style={styles.beneficioItem}>
              <Text style={styles.beneficioLabel}>Total Costo Productos</Text>
              <Text style={styles.beneficioValue}>€{(COSTO_PRODUCTO * totalVentas).toFixed(2)}</Text>
            </View>

            <View style={styles.beneficioItem}>
              <Text style={styles.beneficioLabel}>Total Gasto Envío (Correos)</Text>
              <Text style={styles.beneficioValue}>€{gastosEnvioTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.beneficioItem}>
              <Text style={styles.beneficioLabel}>Costes Marketing</Text>
              <Text style={styles.beneficioValue}>€{(parseFloat(marketingCostes) || 0).toFixed(2)}</Text>
            </View>

            <View style={styles.beneficioItem}>
              <Text style={styles.beneficioLabel}>Extras Costes</Text>
              <Text style={styles.beneficioValue}>€{(parseFloat(extrasCostes) || 0).toFixed(2)}</Text>
            </View>

            <View style={[styles.beneficioItem, styles.beneficioSeparator]}>
              <Text style={styles.beneficioLabel}>Gastos Totales</Text>
              <Text style={styles.beneficioValue}>
                €{((COSTO_PRODUCTO * totalVentas) + gastosEnvioTotal + (parseFloat(marketingCostes) || 0) + (parseFloat(extrasCostes) || 0)).toFixed(2)}
              </Text>
            </View>

            <View style={[styles.beneficioItem, styles.beneficioTotal]}>
              <Text style={styles.beneficioLabel}>Beneficio Bruto</Text>
              <Text style={[styles.beneficioValue, { color: beneficioBruto >= 0 ? '#22863A' : '#E53E3E' }]}>
                €{beneficioBruto.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.beneficioItem, styles.porcentajeBox]}>
              <Text style={styles.beneficioLabel}>% Beneficio</Text>
              <Text style={[styles.beneficioValue, { color: porcentajeBeneficio >= 0 ? '#22863A' : '#E53E3E' }]}>
                {porcentajeBeneficio.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN 3: COMPRADORES POR PROVINCIA */}
        <View style={styles.section}>
          <Text style={globalStyles.subtitle}>Compradores por Provincia</Text>

          {provinciasData.length > 0 && (
            <View style={globalStyles.card}>
              <GraficoGolpes datos={provinciasData} tipoGrafica={'frecuencia'} />
            </View>
          )}

          <View style={styles.provinciasListContainer}>
            {provinciasData.map((provincia, idx) => (
              <View key={idx} style={styles.provinciaItem}>
                <Text style={styles.provinciaName}>{provincia.provincia}</Text>
                <Text style={styles.provinciaCount}>{provincia.valor} comprador{provincia.valor !== 1 ? 'es' : ''}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SECCIÓN 4: DETALLES DE PEDIDOS */}
        <View style={styles.section}>
          <Text style={globalStyles.subtitle}>Detalles de Pedidos - Último Mes</Text>

          {pedidos.length > 0 ? (
            pedidos.map((pedido, idx) => (
              <View key={idx} style={styles.orderItem}>
                <Pressable
                  onPress={() => toggleExpandOrder(pedido.id)}
                  style={styles.orderHeader}
                >
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderDate}>
                      {new Date(pedido.fecha).toLocaleDateString('es-ES')}
                    </Text>
                    <Text style={styles.orderTotal}>€{parseFloat(pedido.total).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.orderStatus}>{pedido.estado || 'Pendiente'}</Text>
                </Pressable>

                {expandedOrderId === pedido.id && (
                  <View style={styles.orderDetails}>
                    <DetailRow label="Cliente" value={pedido.cliente_nombre || 'N/A'} />
                    <DetailRow label="Email" value={pedido.cliente_email || 'N/A'} />
                    <DetailRow label="Teléfono" value={pedido.cliente_telefono || 'N/A'} />
                    <DetailRow label="Dirección" value={pedido.direccion || 'N/A'} />
                    <DetailRow label="Provincia" value={pedido.provincia || 'N/A'} />
                    <DetailRow label="Código Postal" value={pedido.codigo_postal || 'N/A'} />
                    <DetailRow label="Artículos" value={pedido.articulos_count || 'N/A'} />
                    <DetailRow label="Estado" value={pedido.estado || 'Pendiente'} />
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={globalStyles.body}>No hay pedidos en el último mes</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  costesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 8,
  },
  label: {
    fontSize: 12,
    color: '#4A5568',
    marginBottom: 8,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#2D3748',
  },
  beneficioBox: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  beneficioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  beneficioTotal: {
    borderBottomWidth: 2,
    borderBottomColor: '#4299E1',
    backgroundColor: '#EBF8FF',
    marginTop: 8,
  },
  beneficioSeparator: {
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F7FAFC',
  },
  porcentajeBox: {
    borderBottomWidth: 0,
  },
  beneficioLabel: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  beneficioValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  provinciasListContainer: {
    marginTop: 12,
  },
  provinciaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 6,
    marginVertical: 4,
  },
  provinciaName: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  provinciaCount: {
    fontSize: 14,
    color: '#718096',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  orderItem: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderDate: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22863A',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  orderStatus: {
    fontSize: 12,
    color: '#4A5568',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  orderDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  detailValue: {
    fontSize: 12,
    color: '#2D3748',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
});

export default Empresa;
