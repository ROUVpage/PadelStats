import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { Pressable, TextInput, View, Modal, Text, SafeAreaView, StyleSheet, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { typography, globalStyles } from '../styles/theme';
import { UserContext } from '../context/AppContext';
import { getDeviceId } from '../utils/getDeviceId';

const IniciarSesionUsuario = () => {
    const router = useRouter();
    const { setUsuario } = useContext(UserContext);
    const [isVisible, setIsVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [nombre, onChangeNombre] = useState(null);
    const [contraseña, onChangeContraseña] = useState(null);

    const cerrarModal = () => setIsVisible(false);

    const iniciarSesion = async () => {
        try {
            if (!contraseña || !nombre) {
                setErrorMessage('Por favor, completa todos los campos');
                setIsVisible(true);
                return;
            }

            // Obtener deviceId multiplataforma
            let deviceId;
            try {
                deviceId = await getDeviceId();
                console.log('DeviceId generado:', deviceId);
            } catch (error) {
                console.error('Error al obtener deviceId:', error);
                deviceId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            const res = await axios.get('http://127.0.0.1:8000/datos/api/usuarios/');
            
            if (!res.data || !Array.isArray(res.data)) {
                throw new Error('Respuesta del servidor inválida');
            }

            const usuarioEncontrado = res.data.find(user => 
                user.nombre === nombre && user.contraseña === contraseña
            );

            if (!usuarioEncontrado) {
                setErrorMessage('Usuario o contraseña incorrectos');
                setIsVisible(true);
                return;
            }

            try {
                // Actualizar el usuario con el nuevo deviceId
                const actualizacionUsuario = {
                    ...usuarioEncontrado,
                    deviceId1: deviceId
                };

                console.log('Actualizando usuario con deviceId:', deviceId);

                const updateResponse = await axios.put(
                    `http://127.0.0.1:8000/datos/api/usuarios/${usuarioEncontrado.id}/`,
                    actualizacionUsuario,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (updateResponse.status === 200) {
                    console.log('Usuario actualizado exitosamente');
                    // Establecer el usuario en el contexto global
                    setUsuario(actualizacionUsuario);
                    // Guardar el deviceId en localStorage para la web solo si es web
                    // (getDeviceId ya lo hace internamente)
                    router.replace('/');
                } else {
                    throw new Error('Error al actualizar el usuario');
                }
            } catch (updateError) {
                console.error('Error detallado al actualizar usuario:', {
                    message: updateError.message,
                    response: updateError.response?.data,
                    status: updateError.response?.status
                });
                setErrorMessage('Error al actualizar los datos del usuario');
                setIsVisible(true);
            }
        } catch (error) {
            console.error('Error detallado al iniciar sesión:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            let mensajeError = 'Error al conectar con el servidor';
            if (error.response?.status === 500) {
                mensajeError = 'Error interno del servidor. Por favor, intenta más tarde.';
            }

            setErrorMessage(mensajeError);
            setIsVisible(true);
        }
    };

    return (
        <SafeAreaView style={{...globalStyles.container, marginLeft:-12, marginRight:-17}}>
            <View style={styles.loginContainer}>
                <Text style={globalStyles.title}>Iniciar Sesión</Text>

                <Modal
                    transparent={true}
                    visible={isVisible}
                    animationType="fade"
                    onRequestClose={cerrarModal}
                >
                    <View style={globalStyles.modalOverlay}>
                        <View style={globalStyles.modalContainer}>
                            <Text style={[globalStyles.title, { color: '#E74C3C' }]}>
                                ¡Atención!
                            </Text>
                            <Text style={[globalStyles.body, styles.modalMessage]}>
                                {errorMessage}
                            </Text>
                            <Pressable 
                                style={[globalStyles.button, styles.modalButton]} 
                                onPress={cerrarModal}
                            >
                                <Text style={globalStyles.buttonText}>Cerrar</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre:</Text>
                    <TextInput
                        style={globalStyles.input}
                        onChangeText={onChangeNombre}
                        value={nombre}
                        placeholder="Nombre"
                        placeholderTextColor='#95A5A6'
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Contraseña:</Text>
                    <TextInput
                        style={globalStyles.input}
                        onChangeText={onChangeContraseña}
                        value={contraseña}
                        placeholder="Contraseña"
                        secureTextEntry
                        placeholderTextColor='#95A5A6'
                    />
                </View>

                <View style={styles.actionContainer}>
                    <Pressable 
                        style={globalStyles.button}
                        onPress={iniciarSesion}
                    >
                        <Text style={globalStyles.buttonText}>Iniciar Sesión</Text>
                    </Pressable>

                    <Text style={styles.registerText}>
                        No tengo cuenta,{' '}
                        <Link href='/' style={globalStyles.link}>
                            Registrarse
                        </Link>
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#2C3E50',
        lineHeight: 24,
        fontFamily: Platform.select({
          ios: 'Times New Roman',
          android: 'serif'
        }),
    },
    actionContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 16,
        color: '#2C3E50',
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
        fontFamily: Platform.select({
          ios: 'Times New Roman',
          android: 'serif'
        }),
    },
    modalButton: {
        marginTop: 16,
        width: '100%',
    },
});

export default IniciarSesionUsuario;
