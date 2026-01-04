import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, ScrollView, FlatList, SafeAreaView, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import GraficoGolpes from './graficaGolpes';
import { getDeviceId } from '../utils/getDeviceId';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export const UserContext = createContext();

const DetallesSesion = () => {
  const [sesion, setSesion] = useState({});
  const [golpes, setGolpes] = useState([]);
  const [golpesPorIntervalo, setGolpesPorIntervalo] = useState([]);
  const [abierto, setAbierto] = useState({});
  const { id } = useLocalSearchParams();

  const toggleDesplegable = (golpeId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAbierto(prev => ({ ...prev, [golpeId]: !prev[golpeId] }));
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Obtener sesión
        const resSesion = await axios.get(`http://127.0.0.1:8000/datos/api/sesiones/${id}/`);
        setSesion(resSesion.data);

        // Obtener golpes de la sesión
        const resGolpes = await axios.get('http://127.0.0.1:8000/datos/api/datosIA/');
        const golpesFiltrados = resGolpes.data.filter(golpe => golpe.idSesión === parseInt(id));
        setGolpes(golpesFiltrados);

        // Calcular progreso del nivel en 7 intervalos
        if (golpesFiltrados.length > 0 && resSesion.data.duracion) {
          const intervaloDuracion = resSesion.data.duracion / 7;
          const intervalosNivel = Array(7).fill(null).map(() => ({ suma: 0, cantidad: 0 }));
          const frecuenciaGolpes = {};
          
          golpesFiltrados.forEach(golpe => {
            // Convertir tiempo del golpe a minutos desde inicio
            const [horas, minutos, segundos] = golpe.tiempo.split(':').map(Number);
            const tiempoMinutos = horas * 60 + minutos + segundos / 60;
            const intervaloIndex = Math.min(Math.floor(tiempoMinutos / intervaloDuracion), 6);
            
            // Calcular nivel del golpe: (tecnica + precision + potencia + puntoImpacto) / 4
            const nivel = (golpe.tecnica + golpe.precision + golpe.potencia + golpe.puntoImpacto) / 4;
            intervalosNivel[intervaloIndex].suma += nivel;
            intervalosNivel[intervaloIndex].cantidad += 1;
            
            // Contar frecuencia de golpes por tipo
            if (!frecuenciaGolpes[golpe.tipo]) {
              frecuenciaGolpes[golpe.tipo] = Array(7).fill(0);
            }
            frecuenciaGolpes[golpe.tipo][intervaloIndex]++;
          });
          
          // Convertir promedios de nivel
          const datosNivel = intervalosNivel.map((intervalo, index) => ({
            intervalo: `${(index * intervaloDuracion).toFixed(0)}-${((index + 1) * intervaloDuracion).toFixed(0)} min`,
            valor: intervalo.cantidad > 0 ? intervalo.suma / intervalo.cantidad : 0
          }));
          
          setGolpesPorIntervalo(datosNivel);
          
          // Convertir frecuencia de golpes en formato para gráficas
          const datosFrequencia = Object.entries(frecuenciaGolpes).map(([tipo, frecuencias]) => ({
            tipo,
            datos: frecuencias.map((count, index) => ({
              intervalo: `${(index * intervaloDuracion).toFixed(0)}-${((index + 1) * intervaloDuracion).toFixed(0)} min`,
              count
            }))
          }));
          
          // Guardar frecuencia de golpes en estado (para usarla después)
          setGolpes(golpesFiltrados.map(g => ({
            ...g,
            frecuenciasPorIntervalo: frecuenciaGolpes[g.tipo] || []
          })));
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    };

    cargarDatos();
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Características Generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características Generales</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>{new Date(sesion.fecha).toLocaleDateString()}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Duración:</Text>
            <Text style={styles.value}>{sesion.duracion} minutos</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Número de Golpes:</Text>
            <Text style={styles.value}>{sesion.numGolpes}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Exigencia Física Media:</Text>
            <Text style={styles.value}>{sesion.exigenciaFisicaMedia?.toFixed(1)}/10</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Velocidad de Bola Máxima:</Text>
            <Text style={styles.value}>{sesion.velocidadBolaMaxima?.toFixed(1)} km/h</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>Posibilidad de Lesión Media:</Text>
            <Text style={styles.value}>{sesion.posibilidadLesionMedia?.toFixed(1)}/5</Text>
          </View>
        </View>

        {/* Mejor Golpe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mejor Golpe</Text>
          <View style={styles.golpeCard}>
            <Text style={styles.golpeTipo}>{sesion.mejorGolpe}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Técnica</Text>
                <Text style={styles.statValue}>{sesion.mejorGolpeTecnica?.toFixed(1)}/10</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Precisión</Text>
                <Text style={styles.statValue}>{sesion.mejorGolpePrecision?.toFixed(1)}/10</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Potencia</Text>
                <Text style={styles.statValue}>{sesion.mejorGolpePotencia?.toFixed(1)}/10</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Punto Impacto</Text>
                <Text style={styles.statValue}>{sesion.mejorGolpePuntoImpacto?.toFixed(1)}/5</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Peor Golpe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peor Golpe</Text>
          <View style={styles.golpeCard}>
            <Text style={styles.golpeTipo}>{sesion.peorGolpe}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Técnica</Text>
                <Text style={styles.statValue}>{sesion.peorGolpeTecnica?.toFixed(1)}/10</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Precisión</Text>
                <Text style={styles.statValue}>{sesion.peorGolpePrecision?.toFixed(1)}/10</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Potencia</Text>
                <Text style={styles.statValue}>{sesion.peorGolpePotencia?.toFixed(1)}/10</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Punto Impacto</Text>
                <Text style={styles.statValue}>{sesion.peorGolpePuntoImpacto?.toFixed(1)}/5</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gráfico de Progreso del Nivel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progreso del Nivel Durante el Partido</Text>
          <GraficoGolpes datos={golpesPorIntervalo} tipoGrafica={'calidad'}/>
        </View>

        {/* Gráficos de Frecuencia por Tipo de Golpe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frecuencia de Golpes por Intervalo</Text>
          {Object.keys(golpes.reduce((acc, g) => {
            acc[g.tipo] = true;
            return acc;
          }, {})).map((tipo) => {
            const frecuencias = Array(7).fill(0);
            golpes.forEach(golpe => {
              if (golpe.tipo === tipo) {
                const [horas, minutos, segundos] = golpe.tiempo.split(':').map(Number);
                const tiempoMinutos = horas * 60 + minutos + segundos / 60;
                const intervaloDuracion = sesion.duracion / 7;
                const intervaloIndex = Math.min(Math.floor(tiempoMinutos / intervaloDuracion), 6);
                frecuencias[intervaloIndex]++;
              }
            });
            
            const datosFrequencia = frecuencias.map((count, index) => ({
              intervalo: `${(index * (sesion.duracion / 7)).toFixed(0)}-${((index + 1) * (sesion.duracion / 7)).toFixed(0)} min`,
              valor: count
            }));
            
            return (
              <View key={tipo} style={styles.golpeFrequenciaContainer}>
                <Text style={styles.golpeFrequenciaTitulo}>{tipo}</Text>
                <GraficoGolpes datos={datosFrequencia} tipoGrafica={'frecuencia'}/>
              </View>
            );
          })}
        </View>

        {/* Detalles de Todos los Golpes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de Cada Golpe</Text>
          <FlatList
            data={golpes}
            scrollEnabled={false}
            renderItem={({item: golpe}) => (
              <TouchableOpacity 
                onPress={() => toggleDesplegable(golpe.id)} 
                style={styles.golpeItem}
              >
                <View style={styles.golpeHeader}>
                  <Text style={styles.golpeTipoSmall}>{golpe.tipo}</Text>
                  <Text style={styles.golpeTime}>{golpe.tiempo}</Text>
                </View>
                
                {abierto[golpe.id] && (
                  <View style={styles.golpeDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Precisión:</Text>
                      <Text style={styles.detailValue}>{golpe.precision}/10</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Potencia:</Text>
                      <Text style={styles.detailValue}>{golpe.potencia}/10</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Efecto:</Text>
                      <Text style={styles.detailValue}>{golpe.efecto}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Velocidad Bola:</Text>
                      <Text style={styles.detailValue}>{golpe.velocidadBola?.toFixed(1)} km/h</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Exigencia Física:</Text>
                      <Text style={styles.detailValue}>{golpe.exigenciaFisica}/10</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Punto de Impacto:</Text>
                      <Text style={styles.detailValue}>{golpe.puntoImpacto}/5</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Técnica:</Text>
                      <Text style={styles.detailValue}>{golpe.tecnica}/10</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Posibilidad Lesión:</Text>
                      <Text style={styles.detailValue}>{golpe.posibilidadLesion}/5</Text>
                    </View>

                    {golpe.consejosTecnicos?.length > 0 && (
                      <View style={styles.consejosBox}>
                        <Text style={styles.consejosTitle}>Consejos técnicos</Text>
                        {golpe.consejosTecnicos.map((c, idx) => (
                          <View key={idx} style={styles.consejoItem}>
                            <Text style={styles.consejoNivel}>{c.nivel}</Text>
                            <Text style={styles.consejoError}>{c.error}</Text>
                            <Text style={styles.consejoTexto}>{c.consejo}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={golpe => golpe.id.toString()}
          />
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <Link href={'/'} style={styles.navLink}>
          <Text style={styles.navText}>Inicio</Text>
        </Link>
        <Link href={'/IniciarSesion'} style={styles.navLink}>
          <Text style={styles.navText}>Iniciar sesión</Text>
        </Link>
        <Link href={'/Usuario'} style={styles.navLink}>
          <Text style={styles.navText}>Perfil</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
};

export default DetallesSesion;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  label: {
    fontSize: 16,
    color: '#718096',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  golpeCard: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  golpeTipo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4299E1',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '45%',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  golpeItem: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
  },
  golpeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  golpeTipoSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  golpeTime: {
    fontSize: 14,
    color: '#718096',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  golpeDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  consejosBox: {
    marginTop: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  consejosTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22543D',
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  consejoItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  consejoNivel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F855A',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  consejoError: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 2,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  consejoTexto: {
    fontSize: 13,
    color: '#4A5568',
    marginTop: 2,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  golpeFrequenciaContainer: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
  },
  golpeFrequenciaTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navLink: {
    padding: 8,
  },
  navText: {
    fontSize: 14,
    color: '#4299E1',
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
});
