import React, { createContext, useState, useEffect } from 'react';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
import { Pressable, ScrollView, TextInput, View, Modal, FlatList, SafeAreaView, Text, StyleSheet, Button, Platform, Image } from 'react-native';
import { Link } from 'expo-router';
import GraficoGolpes from './graficaGolpes';
import { globalStyles } from '../styles/theme';
import { launchImageLibrary } from 'react-native-image-picker';
import { getDeviceId } from '../utils/getDeviceId';

// Importar la imagen predeterminada
const defaultProfileImage = require('../img/icono-perfil-avatar-predeterminado-imagen-usuario-redes-sociales-icono-avatar-gris-silueta-perfil-blanco-ilustracion-vectorial_561158-3383-296977501.jpg');

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [usuario, setUsuario] = useState(false);
  const [nombre, onChangeNombre] = useState(null)
  const [correo, onChangeCorreo] = useState(null)
  const [peso, onChangePeso] = useState(null)
  const [altura, onChangeAltura] = useState(null)
  const [manoDominante, onChangeMano] = useState(null)
  const [contraseña, onChangeContraseña] = useState(null)
  const [items, setItems] = useState([
    {label: 'Diestro', value: 'derecha'},
    {label: 'Zurdo', value: 'izquierda'}
  ])
  const [sesiones, setSesiones] = useState([])
  const [datosIA, setDatosIA] = useState([])
  const [foto, setFoto] = useState(null);
  const [evolucionNivel, setEvolucionNivel] = useState([]);
  const [top5Errores, setTop5Errores] = useState([]);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const deviceId = await getDeviceId();

        console.log('DeviceId actual:', deviceId);

        if (!deviceId) {
          console.log('No se pudo obtener deviceId');
          return;
        }

        const res = await axios.get('http://127.0.0.1:8000/datos/api/usuarios/');
        const listaUsuarios = res.data;
        console.log('Buscando usuario con deviceId:', deviceId);

        const usuarioEncontrado = listaUsuarios.find(user => 
          user.deviceId == deviceId || 
          user.deviceId1 == deviceId
        );

        console.log('Usuario encontrado:', usuarioEncontrado ? 'Sí' : 'No');

        if (usuarioEncontrado) {
          setUsuario(usuarioEncontrado);
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error);
      }
    };
    const sesiones = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/datos/api/sesiones/');
        const todasLasSesiones = res.data;
        const ultimasSesiones = todasLasSesiones.slice(-3).reverse();
        setSesiones(ultimasSesiones);
        return ultimasSesiones;
      } catch (error) {
        console.error('Error al obtener las sesiones:', error);
        return [];
      }
    };
    
    const cargarDatos = async () => {
      const sesionesObtenidas = await sesiones();
      try {
        const res = await axios.get('http://127.0.0.1:8000/datos/api/datosIA/');
        const todasLasSesiones = res.data;
  
        const datos = sesionesObtenidas.map(sesion =>
          todasLasSesiones.filter(dato => dato.sesionId === sesion.id)
        );
        setDatosIA(datos);

        // Calcular evolución del nivel en últimas 10 sesiones
        const resSesiones = await axios.get('http://127.0.0.1:8000/datos/api/sesiones/');
        const todasSesiones = resSesiones.data;
        const ultimas10Sesiones = todasSesiones.slice(-10).reverse();
        
        const datosEvolucion = ultimas10Sesiones.map(sesion => {
          const datosSesion = todasLasSesiones.filter(dato => dato.sesionId === sesion.id);
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
          const datosSesion = todasLasSesiones.filter(dato => dato.sesionId === sesion.id);
          
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
            golpes: [...new Set(golpesError[error])].slice(0, 3)
          }));
        
        setTop5Errores(top5);
      } catch (error) {
        console.error('Error al obtener las datosIA:', error);
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
  
  const cerrarModal = () => setIsVisible(false)

  const seleccionarFoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
    });

    if (!result.didCancel && result.assets && result.assets[0]) {
      setFoto(result.assets[0].uri);
    }
  };

  const registrarse = async () => {
    try {
      // Validación de campos requeridos
      if (!nombre || !correo || !peso || !altura || !manoDominante || !contraseña) {
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 2000);
        return;
      }
  
      // Obtener deviceId según la plataforma
      let deviceId;
      try {
        deviceId = await getDeviceId();
        console.log('DeviceId generado:', deviceId);
      } catch (error) {
        console.error('Error al obtener deviceId:', error);
        // Fallback en caso de error
        deviceId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
  
      const userData = {
        nombre: nombre.trim(),
        correo: correo.trim(),
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        manoDominante: manoDominante === 'Diestro',
        contraseña: contraseña,
        deviceId: deviceId,
        foto: foto || 'default'
      };
  
      console.log('Intentando registrar usuario con datos:', { ...userData, contraseña: '***' });
  
      const response = await axios.post('http://127.0.0.1:8000/datos/api/usuarios/', userData);
      console.log('Respuesta del servidor:', response.status);
  
      if (response.status === 201) {
        setUsuario(true);
      }
    } catch (error) {
      console.error('Error detallado al registrarse:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 2000);
    }
  };

  return usuario ? (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={globalStyles.title}>Últimas sesiones</Text>
        <View style={styles.sessionsContainer}>
        <FlatList
          data={sesiones}
          renderItem={({item:sesion}) => 
            <Link href={`${sesion.id}`} asChild>
              <View style={globalStyles.card}>
                <Text style={globalStyles.subtitle}>{sesion.fecha || 'Fecha no disponible'}</Text>
                <View style={styles.statsRow}>
                  <View style={globalStyles.stat}>
                    <Text style={globalStyles.statValue}>{sesion.calidadMedia || 'N/A'}</Text>
                    <Text style={globalStyles.statLabel}>Calidad</Text>
                  </View>
                  <View style={globalStyles.stat}>
                    <Text style={globalStyles.statValue}>{sesion.numGolpes || 0}</Text>
                    <Text style={globalStyles.statLabel}>Golpes</Text>
                  </View>
                  <View style={globalStyles.stat}>
                    <Text style={globalStyles.statValue}>
                      {sesion.numGolpes > 0 ? (sesion.erroresNoForzados / sesion.numGolpes).toFixed(2) : 'N/A'}
                    </Text>
                    <Text style={globalStyles.statLabel}>Errores</Text>
                  </View>
                </View>
                <Text style={styles.duration}>Duración: {sesion.duracion || 'N/A'} min</Text>
                
                <View style={styles.additionalStats}>
                  <Text style={styles.infoText}>Exigencia Física: {sesion.exigenciaFisicaMedia?.toFixed(1) || 'N/A'}/10</Text>
                  <Text style={styles.infoText}>Vel. Máxima: {sesion.velocidadBolaMaxima?.toFixed(1) || 'N/A'} km/h</Text>
                  <Text style={styles.infoText}>Riesgo Lesión: {sesion.posibilidadLesionMedia?.toFixed(1) || 'N/A'}/5</Text>
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
                <View style={styles.graphContainer}>
                  <GraficoGolpes datos1={datosIA} tipoGrafica={'calidad'}/>
                  <GraficoGolpes datos1={datosIA} tipoGrafica={'errores'}/>
                </View>
              </View>
            </Link>}
          keyExtractor={sesion => sesion.id}
        />

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
        
        <View style={styles.navigationBar}>
          <Link href={'/'} style={[globalStyles.link, styles.navLink]}>Inicio</Link>
          <Link href={'/IniciarSesion'} style={[globalStyles.link, styles.navLink]}>Iniciar sesión</Link>
          <Link href={'/Usuario'} style={[globalStyles.link, styles.navLink]}>Perfil</Link>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  ): (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Modal
          transparent={true}
          visible={isVisible}
          animationType="fade"
          onRequestClose={cerrarModal}
        >
          <View style={globalStyles.modalOverlay}>
            <View style={globalStyles.modalContainer}>
              <Text style={[globalStyles.title, { color: '#E74C3C' }]}>¡Atención!</Text>
              <Text style={[globalStyles.body, styles.modalMessage]}>Debes rellenar todos los parámetros</Text>
              <Pressable 
                style={[globalStyles.button, styles.modalButton]} 
                onPress={cerrarModal}
              >
                <Text style={globalStyles.buttonText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <Text style={globalStyles.title}>Registrarse</Text>
        <View style={styles.imageContainer}>
          <Image
            source={foto ? { uri: foto } : defaultProfileImage}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <Pressable
            style={[globalStyles.button, styles.photoButton]}
            onPress={seleccionarFoto}
          >
            <Text style={globalStyles.buttonText}>Seleccionar Foto</Text>
          </Pressable>
        </View>
        <TextInput
          style={globalStyles.input}
          onChangeText={onChangeNombre}
          value={nombre}
          placeholder="Nombre"
          placeholderTextColor='#7F8C8D'
        />
        <TextInput
          style={globalStyles.input}
          onChangeText={onChangeCorreo}
          value={correo}
          placeholder="Correo Electrónico"
          keyboardType="email-address"
          placeholderTextColor='#7F8C8D'
        />
        <TextInput
          style={globalStyles.input}
          onChangeText={onChangePeso}
          value={peso}
          placeholder="Peso (en kg)"
          keyboardType="numeric"
          placeholderTextColor='#7F8C8D'
        />
        <TextInput
          style={globalStyles.input}
          onChangeText={onChangeAltura}
          value={altura}
          placeholder="Altura (en cm)"
          keyboardType="numeric"
          placeholderTextColor='#7F8C8D'
        />
        <View style={styles.dropdownContainer}>
          <DropDownPicker
            open={open}
            value={manoDominante}
            items={items}
            setOpen={setOpen}
            setValue={onChangeMano}
            setItems={setItems}
            placeholder="Mano dominante"
            style={styles.dropdown}
            dropDownStyle={styles.dropdownList}
            textStyle={styles.dropdownText}
            placeholderStyle={styles.dropdownPlaceholder}
          />
        </View>
        <TextInput
          style={globalStyles.input}
          onChangeText={onChangeContraseña}
          value={contraseña}
          placeholder="Contraseña"
          secureTextEntry
          placeholderTextColor='#7F8C8D'
        />
        <View style={styles.actionContainer}>
          <Pressable 
            style={globalStyles.button} 
            onPress={registrarse}
            accessibilityLabel="Botón para registrarse"
          >
            <Text style={globalStyles.buttonText}>Registrarse</Text>
          </Pressable>
          <Text style={styles.loginText}>
            Ya tengo cuenta,{' '}
            <Link href='/IniciarSesionUsuario' style={globalStyles.link}>
              Iniciar Sesión
            </Link>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sessionsContainer: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  duration: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 24,
    marginVertical: 12,
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
  infoText: {
    fontSize: 14,
    color: '#2D3748',
    marginVertical: 4,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
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
  dropdownContainer: {
    marginVertical: 12,
    zIndex: 1000,
  },
  dropdown: {
    borderColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    height: 50,
  },
  dropdownList: {
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#2D3748',
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  dropdownPlaceholder: {
    color: '#718096',
  },
  actionContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#2D3748',
    lineHeight: 24,
    marginTop: 16,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  modalMessage: {
    textAlign: 'center',
    marginVertical: 16,
  },
  modalButton: {
    marginTop: 16,
    width: '100%',
  },
  modalText: {
    fontSize: 16,
    color: '#2D3748',
    textAlign: 'center',
    marginVertical: 8,
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
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  photoButton: {
    marginTop: 8,
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
});

export default UserProvider;
