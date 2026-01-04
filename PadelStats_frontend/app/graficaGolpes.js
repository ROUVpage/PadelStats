import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { differenceInMinutes, parseISO } from 'date-fns';

const GraficoGolpes = ({ datos1, datos, tipoGrafica, golpeTipo = false }) => {
  const procesarDatos = useCallback((datosEntrada, tipo) => {
    if (!datosEntrada || datosEntrada.length === 0) return [];
    
    // Si es gráfico de frecuencia, los datos ya vienen procesados
    if (tipo === 'frecuencia') {
      return datosEntrada.map(item => ({
        tiempo: item.intervalo,
        valor: item.count,
      }));
    }
    
    const inicio = parseISO(datosEntrada[0].timestamp);
    const contadores = {};

    datosEntrada.forEach(dato => {
      const fecha = parseISO(dato.timestamp);
      const minutosDesdeInicio = differenceInMinutes(fecha, inicio);
      const bloque = Math.floor(minutosDesdeInicio / 5) * 5;

      if (tipo === 'errores' && dato.errorNoForzado) {
        contadores[bloque] = (contadores[bloque] || 0) + 1;
      } else if (tipo === 'calidad' && dato.calidad !== undefined) {
        contadores[bloque] = contadores[bloque] || { suma: 0, cantidad: 0 };
        contadores[bloque].suma += dato.calidad;
        contadores[bloque].cantidad += 1;
      } else if (tipo === 'golpes' && dato.tipo === golpeTipo) {
        contadores[bloque] = (contadores[bloque] || 0) + 1;
      }
    });

    return Object.entries(contadores).map(([minuto, valor]) => ({
      tiempo: `${minuto}m`,
      valor: tipo === 'calidad' ? valor.suma / valor.cantidad : valor,
    })).sort((a, b) => parseInt(a.tiempo) - parseInt(b.tiempo));
  }, []);

  const datosGrafico = useMemo(() => {
    const datosParaProcesar = tipoGrafica === 'frecuencia' ? datos : datos1;
    return procesarDatos(datosParaProcesar, tipoGrafica);
  }, [datos, datos1, tipoGrafica, golpeTipo, procesarDatos]);

  const chartTheme = {
    axis: {
      style: {
        axis: {
          stroke: '#E2E8F0',
          strokeWidth: 1,
        },
        grid: {
          stroke: '#F7FAFC',
          strokeWidth: 1,
        },
        ticks: {
          stroke: '#E2E8F0',
          size: 5,
        },
        tickLabels: {
          fill: '#2D3748',
          fontSize: 12,
          padding: 5,
          fontFamily: Platform.select({
            ios: 'Times New Roman',
            android: 'serif'
          }),
        }
      }
    },
    bar: {
      style: {
        data: {
          fill: '#4A5568',
          width: 20
        }
      }
    }
  };

  return (
    <View style={{ height: 300, marginVertical: 10 }}>
      <VictoryChart 
        theme={chartTheme} 
        domainPadding={20}
        animate={{
          duration: 500,
          onLoad: { duration: 300 }
        }}
      >
        <VictoryAxis
          tickFormat={datosGrafico.map(d => d.tiempo)}
          style={{ 
            tickLabels: { 
              angle: -45,
              textAnchor: 'end',
              fill: '#2D3748',
              fontSize: 12,
              fontFamily: Platform.select({
                ios: 'Times New Roman',
                android: 'serif'
              }),
            } 
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(x) => `${x}`}
          style={{
            tickLabels: { 
              fill: '#2D3748',
              fontSize: 12,
              fontFamily: Platform.select({
                ios: 'Times New Roman',
                android: 'serif'
              }),
            }
          }}
        />
        <VictoryBar
          data={datosGrafico}
          x="tiempo"
          y="valor"
          style={{ 
            data: { 
              fill: tipoGrafica === 'frecuencia' ? '#48BB78' : '#4A5568',
              width: 20
            } 
          }}
          cornerRadius={4}
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  legendText: {
    fontSize: 14,
    color: '#2D3748',
    marginLeft: 8,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  noDataText: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
});

export default GraficoGolpes;
