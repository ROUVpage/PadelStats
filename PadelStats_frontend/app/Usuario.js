import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { View, FlatList, SafeAreaView, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Link } from 'expo-router';
import GraficoGolpes from './graficaGolpes';
import { colors, spacing, typography, globalStyles } from '../styles/theme';
import { getDeviceId } from '../utils/getDeviceId';

// Importar la imagen predeterminada
const defaultProfileImage = require('../img/icono-perfil-avatar-predeterminado-imagen-usuario-redes-sociales-icono-avatar-gris-silueta-perfil-blanco-ilustracion-vectorial_561158-3383-296977501.jpg');

export const UserContext = createContext();

const Usuario = ({ children }) => {
  const [usuario, setUsuario] = useState(false);
  const [sesiones, setSesiones] = useState([]);
  const [datosIA, setDatosIA] = useState([]);
  const [evolucionNivel, setEvolucionNivel] = useState([]);
  const [top5Errores, setTop5Errores] = useState([]);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const deviceId = await getDeviceId();
        const res = await axios.get('http://127.0.0.1:8000/datos/api/usuarios/');
        const listaUsuarios = res.data;

        const usuarioEncontrado = listaUsuarios.find(user => user.deviceId === deviceId || user.deviceId1 === deviceId);
        if (usuarioEncontrado) {
          setUsuario(usuarioEncontrado);
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error);
      }
    };
    
    const cargarDatos = async () => {
      try {
        const resSesiones = await axios.get('http://127.0.0.1:8000/datos/api/sesiones/');
        const todasSesiones = resSesiones.data;
        const ultimasSesiones = todasSesiones.slice(-5).reverse();
        setSesiones(ultimasSesiones);

        const resIA = await axios.get('http://127.0.0.1:8000/datos/api/datosIA/');
        
        // Calcular datos para últimas 5 sesiones mostradas
        const datosCalculados = ultimasSesiones.map(sesion => {
          const datosSesion = resIA.data.filter(dato => dato.sesionId === sesion.id);
          let mejorGolpe;
          let calidadMejorGolpe;
          let peorGolpe;
          let calidadPeorGolpe;
          let nivelTotal = 0;
          let exigenciaFisicaTotal = 0;
          let numGolpes = 0;
          
          datosSesion.forEach((dato) => {
            // Nivel = media de técnica, precisión, potencia y punto_impacto
            const nivel = (dato.tecnica + dato.precision + dato.potencia + dato.puntoImpacto) / 4;
            nivelTotal = (nivelTotal * numGolpes + nivel) / (numGolpes + 1);
            exigenciaFisicaTotal = (exigenciaFisicaTotal * numGolpes + (dato.exigenciaFisica || 0)) / (numGolpes + 1);
            numGolpes += 1;
            
            if (!calidadMejorGolpe || nivel > calidadMejorGolpe) {
              mejorGolpe = dato.tipo;
              calidadMejorGolpe = nivel;
            }
            
            if (!calidadPeorGolpe || nivel < calidadPeorGolpe) {
              peorGolpe = dato.tipo;
              calidadPeorGolpe = nivel;
            }
          });

          return {
            mejorGolpe,
            calidadMejorGolpe,
            peorGolpe,
            calidadPeorGolpe,
            nivelMedia: nivelTotal,
            exigenciaFisicaMedia: exigenciaFisicaTotal,
            numGolpes,
            sesionId: sesion.id
          };
        });

        setDatosIA(datosCalculados);
        
        // Calcular evolución del nivel en últimas 10 sesiones
        const ultimas10Sesiones = todasSesiones.slice(-10).reverse();
        const datosEvolucion = ultimas10Sesiones.map(sesion => {
          const datosSesion = resIA.data.filter(dato => dato.sesionId === sesion.id);
          let nivelTotal = 0;
          let numGolpes = 0;
          
          datosSesion.forEach((dato) => {
            const nivel = (dato.tecnica + dato.precision + dato.potencia + dato.puntoImpacto) / 4;
            nivelTotal = (nivelTotal * numGolpes + nivel) / (numGolpes + 1);
            numGolpes += 1;
          });
          
          return {
            fecha: new Date(sesion.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
            valor: nivelTotal
          };
        });
        
        setEvolucionNivel(datosEvolucion);
        
        // Calcular Top 5 errores en últimas 10 sesiones
        const conteoErrores = {};
        const golpesError = {};
        
        ultimas10Sesiones.forEach(sesion => {
          const datosSesion = resIA.data.filter(dato => dato.sesionId === sesion.id);
          
          datosSesion.forEach(golpe => {
            (golpe.consejosTecnicos || []).forEach(consejoTecnico => {
              const errorNombre = consejoTecnico.criterio_nombre || consejoTecnico.error;
              conteoErrores[errorNombre] = (conteoErrores[errorNombre] || 0) + 1;
              
              if (!golpesError[errorNombre]) {
                golpesError[errorNombre] = [];
              }
              golpesError[errorNombre].push(golpe.tipo);
            });
          });
        });
        
        // Ordenar y tomar top 5
        const top5 = Object.entries(conteoErrores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([error, count]) => ({
            error,
            count,
            golpes: [...new Set(golpesError[error])].slice(0, 3) // Top 3 golpes donde ocurre
          }));
        
        setTop5Errores(top5);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    };

    fetchUsuario();
    cargarDatos();
  }, []);

  const getCorrectionTip = (error) => {
    const correcciones = {
      'Armado/Preparación': 'Prepara la pala más arriba y con más tiempo. Abre bien los hombros.',
      'Peso corporal': 'Carga más peso en la pierna trasera y transfiere hacia adelante al impacto.',
      'Flexión de piernas': 'Flexiona más las piernas para generar potencia desde abajo.',
      'Punto de impacto': 'Intenta contactar la pelota más adelante de tu cuerpo.',
      'Tipo de golpeo': 'Ajusta el tipo de golpe según la situación del juego.',
      'Terminación corporal': 'Mantén el tronco erguido y recupera posición rápidamente.',
      'Finalización brazo': 'Acompaña el golpe con la extensión completa del brazo.',
      'Posición de impacto': 'Posiciónate correctamente en relación a la pelota.'
    };
    return correcciones[error] || 'Mejora tu técnica y ejecución en este golpe.';
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.profileSection}>
        <View style={styles.header}>
          <Image 
            source={usuario.img && usuario.img !== 'default' ? { uri: usuario.img } : defaultProfileImage}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <View style={styles.userInfo}>
            <Text style={[globalStyles.title, styles.userName]}>{usuario.nombre}</Text>
            <Text style={[globalStyles.body, styles.userEmail]}>{usuario.correo}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[globalStyles.stat, styles.statItem]}>
            <Text style={globalStyles.statValue}>{usuario.peso || 'N/A'}</Text>
            <Text style={globalStyles.statLabel}>Peso (kg)</Text>
          </View>
          <View style={[globalStyles.stat, styles.statItem]}>
            <Text style={globalStyles.statValue}>{usuario.altura || 'N/A'}</Text>
            <Text style={globalStyles.statLabel}>Altura (cm)</Text>
          </View>
          <View style={[globalStyles.stat, styles.statItem]}>
            <Text style={globalStyles.statValue}>{usuario.manoDominante || 'N/A'}</Text>
            <Text style={globalStyles.statLabel}>Mano</Text>
          </View>
        </View>

        <Link href={'/editarUsuario'} asChild>
          <Pressable style={[globalStyles.button, styles.editButton]}>
            <Text style={globalStyles.buttonText}>Editar Perfil</Text>
          </Pressable>
        </Link>

        {usuario.es_entrenador && (
          <Link href={'/Empresa'} asChild>
            <Pressable style={[globalStyles.button, styles.empresaButton]}>
              <Text style={globalStyles.buttonText}>Panel de Empresa</Text>
            </Pressable>
          </Link>
        )}
      </View>

      <Text style={[globalStyles.subtitle, styles.sectionTitle]}>Progreso del Nivel</Text>
      {evolucionNivel.length > 0 && (
        <View style={globalStyles.card}>
          <GraficoGolpes datos={evolucionNivel} tipoGrafica={'calidad'}/>
        </View>
      )}

      <Text style={[globalStyles.subtitle, styles.sectionTitle]}>Errores Más Comunes (Últimas 10 Sesiones)</Text>
      <View style={globalStyles.card}>
        {top5Errores.length > 0 ? (
          top5Errores.map((item, idx) => (
            <View key={idx} style={styles.errorItem}>
              <View style={styles.errorHeader}>
                <Text style={styles.errorRank}>#{idx + 1}</Text>
                <Text style={styles.errorNombre}>{item.error}</Text>
                <Text style={styles.errorCount}>{item.count}x</Text>
              </View>
              <View style={styles.golpesContainer}>
                <Text style={styles.golpesLabel}>Ocurre en:</Text>
                <Text style={styles.golpesValor}>{item.golpes.join(', ')}</Text>
              </View>
              <View style={styles.correccionContainer}>
                <Text style={styles.correccionLabel}>💡 Corrección:</Text>
                <Text style={styles.correccionValor}>{getCorrectionTip(item.error)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={globalStyles.body}>No hay datos suficientes</Text>
        )}
      </View>

      <Text style={[globalStyles.subtitle, styles.sectionTitle]}>Últimas Sesiones</Text>
      
      <FlatList
        data={sesiones}
        renderItem={({item: sesion}) => (
          <Link href={`${sesion.id}`} asChild>
            <Pressable style={globalStyles.card}>
              <Text style={globalStyles.subtitle}>{sesion.fecha || 'Fecha no disponible'}</Text>
              <View style={styles.sessionStats}>
                <View style={globalStyles.stat}>
                  <Text style={globalStyles.statValue}>{sesion.duracion || '0'}</Text>
                  <Text style={globalStyles.statLabel}>Duración (min)</Text>
                </View>
                <View style={globalStyles.stat}>
                  <Text style={globalStyles.statValue}>{sesion.numGolpes || '0'}</Text>
                  <Text style={globalStyles.statLabel}>Golpes</Text>
                </View>
                <View style={globalStyles.stat}>
                  <Text style={globalStyles.statValue}>{sesion.nivelMedia?.toFixed(1) || 'N/A'}</Text>
                  <Text style={globalStyles.statLabel}>Nivel</Text>
                </View>
              </View>
              
              <View style={styles.additionalStats}>
                <Text style={styles.infoText}>Exigencia Física: {sesion.exigenciaFisicaMedia?.toFixed(1) || 'N/A'}/10</Text>
              </View>

              <View style={styles.bestWorstContainer}>
                <View style={styles.bestContainer}>
                  <Text style={styles.labelText}>Mejor Golpe</Text>
                  <Text style={styles.valueText}>{sesion.mejorGolpe || 'N/A'}</Text>
                  <View style={styles.statsGrid}>
                    <Text style={styles.qualityText}>Técnica: {sesion.mejorGolpeTecnica?.toFixed(1) || 'N/A'}/10</Text>
                    <Text style={styles.qualityText}>Precisión: {sesion.mejorGolpePrecision?.toFixed(1) || 'N/A'}/10</Text>
                  </View>
                </View>
                <View style={styles.worstContainer}>
                  <Text style={styles.labelText}>Peor Golpe</Text>
                  <Text style={styles.valueText}>{sesion.peorGolpe || 'N/A'}</Text>
                  <View style={styles.statsGrid}>
                    <Text style={styles.qualityText}>Técnica: {sesion.peorGolpeTecnica?.toFixed(1) || 'N/A'}/10</Text>
                    <Text style={styles.qualityText}>Precisión: {sesion.peorGolpePrecision?.toFixed(1) || 'N/A'}/10</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </Link>
        )}
        keyExtractor={sesion => sesion.id}
      />

      <View style={styles.navigationBar}>
        <Link href={'/'} style={[globalStyles.link, styles.navLink]}>
          <Text style={styles.navText}>Inicio</Text>
        </Link>
        <Link href={'/IniciarSesion'} style={[globalStyles.link, styles.navLink]}>
          <Text style={styles.navText}>Iniciar sesión</Text>
        </Link>
        <Link href={'/Usuario'} style={[globalStyles.link, styles.navLink]}>
          <Text style={styles.navText}>Perfil</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    marginBottom: 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F6FA',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  userEmail: {
    color: '#7F8C8D',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },  statItem: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  editButton: {
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  duration: {
    fontSize: 16,
    color: '#2D3748',
    lineHeight: 24,
    marginVertical: 12,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  bestWorstContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  bestContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    marginRight: 8,
  },
  worstContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    marginLeft: 8,
  },
  labelText: {
    fontSize: 14,
    color: '#718096',
    letterSpacing: 0,
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  valueText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    letterSpacing: 0,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  qualityText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginVertical: 2,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  statsGrid: {
    marginTop: 8,
  },
  additionalStats: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
  },
  graphContainer: {
    marginTop: 24,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    marginTop: 24,
  },
  navLink: {
    padding: 12,
  },
  navText: {
    fontSize: 16,
    color: '#4299E1',
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  profileText: {
    fontSize: 16,
    color: '#2D3748',
    marginVertical: 4,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  infoText: {
    fontSize: 14,
    color: '#2D3748',
    marginVertical: 4,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  editText: {
    fontSize: 16,
    color: '#4299E1',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  statsText: {
    fontSize: 18,
    color: '#2D3748',
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 16,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  errorItem: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorRank: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E53E3E',
    width: 32,
  },
  errorNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    marginLeft: 8,
  },
  errorCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4299E1',
  },
  golpesContainer: {
    marginVertical: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 6,
    padding: 8,
  },
  golpesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 4,
  },
  golpesValor: {
    fontSize: 12,
    color: '#2D3748',
    fontStyle: 'italic',
  },
  correccionContainer: {
    marginTop: 8,
    backgroundColor: '#FFFAF0',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ED8936',
  },
  correccionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ED8936',
    marginBottom: 4,
  },
  correccionValor: {
    fontSize: 12,
    color: '#2D3748',
    lineHeight: 16,
  },
  empresaButton: {
    marginTop: 8,
    backgroundColor: '#7C3AED',
  },
});

export default Usuario;
