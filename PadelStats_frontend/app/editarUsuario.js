import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, ScrollView, SafeAreaView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, globalStyles } from '../styles/theme';
import { launchImageLibrary } from 'react-native-image-picker';
import { getDeviceId } from '../utils/getDeviceId';

const defaultProfileImage = require('../img/icono-perfil-avatar-predeterminado-imagen-usuario-redes-sociales-icono-avatar-gris-silueta-perfil-blanco-ilustracion-vectorial_561158-3383-296977501.jpg');

const EditarUsuario = () => {
    const [usuario, setUsuario] = useState({});
    const router = useRouter();

    useEffect(() => {
        const fetchUsuario = async () => {
            try {
                const deviceId = await getDeviceId();
                const res = await axios.get('http://127.0.0.1:8000/datos/api/usuarios/');
                const listaUsuarios = res.data;

                const usuarioEncontrado = listaUsuarios.find(user => user.deviceId === deviceId || user.deviceId1 === deviceId);
                if (usuarioEncontrado) {
                    setUsuario(usuarioEncontrado);
                    setFormData({
                        nombre: usuarioEncontrado.nombre || '',
                        correo: usuarioEncontrado.email || '',
                        contraseña: usuarioEncontrado.contraseña || '',
                        altura: usuarioEncontrado.altura || '',
                        peso: usuarioEncontrado.peso || '',
                        manoDominante: usuarioEncontrado.manoDominante || '',
                        foto: usuarioEncontrado.foto || 'default',
                    });
                }
            } catch (error) {
                console.error('Error al obtener usuario por dispositivo:', error);
            }
        };
        fetchUsuario();
    }, []);
    
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        contraseña: '',
        altura: '',
        peso: '',
        manoDominante: '',
        foto: 'default',
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const seleccionarFoto = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.7,
            maxWidth: 300,
            maxHeight: 300,
        });

        if (!result.didCancel && result.assets && result.assets[0]) {
            handleChange('foto', result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        try {
            await axios.put(`http://127.0.0.1:8000/datos/api/usuarios/${usuario.id}`, formData);
            router.push('/usuario');
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
        }
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={globalStyles.title}>Editar Perfil</Text>
                
                <View style={styles.imageContainer}>
                    <Image
                        source={formData.foto && formData.foto !== 'default' ? { uri: formData.foto } : defaultProfileImage}
                        style={styles.profileImage}
                        resizeMode="cover"
                    />
                    <Pressable
                        style={[globalStyles.button, styles.photoButton]}
                        onPress={seleccionarFoto}
                    >
                        <Text style={globalStyles.buttonText}>Cambiar Foto</Text>
                    </Pressable>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre:</Text>
                    <TextInput
                        style={globalStyles.input}
                        value={formData.nombre}
                        onChangeText={(value) => handleChange('nombre', value)}
                        placeholder="Nombre"
                        placeholderTextColor="#7F8C8D"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Correo:</Text>
                    <TextInput
                        style={globalStyles.input}
                        value={formData.correo}
                        onChangeText={(value) => handleChange('correo', value)}
                        placeholder="Correo"
                        keyboardType="email-address"
                        placeholderTextColor="#7F8C8D"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Contraseña:</Text>
                    <TextInput
                        style={globalStyles.input}
                        value={formData.contraseña}
                        onChangeText={(value) => handleChange('contraseña', value)}
                        placeholder="Contraseña"
                        secureTextEntry
                        placeholderTextColor="#7F8C8D"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Altura (cm):</Text>
                    <TextInput
                        style={globalStyles.input}
                        value={formData.altura}
                        onChangeText={(value) => handleChange('altura', value)}
                        placeholder="Altura"
                        keyboardType="numeric"
                        placeholderTextColor="#7F8C8D"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Peso (kg):</Text>
                    <TextInput
                        style={globalStyles.input}
                        value={formData.peso}
                        onChangeText={(value) => handleChange('peso', value)}
                        placeholder="Peso"
                        keyboardType="numeric"
                        placeholderTextColor="#7F8C8D"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Mano Dominante:</Text>
                    <TextInput
                        style={globalStyles.input}
                        value={formData.manoDominante}
                        onChangeText={(value) => handleChange('manoDominante', value)}
                        placeholder="Mano Dominante"
                        placeholderTextColor="#7F8C8D"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>URL de la foto:</Text>
                    <TextInput
                        style={globalStyles.input}
                        value={formData.foto}
                        onChangeText={(value) => handleChange('foto', value)}
                        placeholder="URL de la foto"
                        placeholderTextColor="#7F8C8D"
                    />
                </View>

                <Pressable 
                    style={[globalStyles.button, styles.submitButton]} 
                    onPress={handleSubmit}
                >
                    <Text style={globalStyles.buttonText}>Guardar Cambios</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#2C3E50',
        fontFamily: Platform.select({
            ios: 'Times New Roman',
            android: 'serif'
        }),
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 14,
        marginTop: 4,
        fontFamily: Platform.select({
            ios: 'Times New Roman',
            android: 'serif'
        }),
    },
    modalText: {
        fontSize: 16,
        color: '#2C3E50',
        textAlign: 'center',
        marginVertical: 8,
        fontFamily: Platform.select({
            ios: 'Times New Roman',
            android: 'serif'
        }),
    },
    submitButton: {
        marginTop: 32,
        marginBottom: 32,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 8,
    },
    photoButton: {
        marginTop: 8,
    },
});

export default EditarUsuario;