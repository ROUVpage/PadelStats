import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import BluetoothSerial from 'react-native-bluetooth-serial-next';

export const useBluetooth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const initializeBluetooth = async () => {
    if (Platform.OS === 'web') return;
    
    try {
      await BluetoothSerial.enable();
      const devices = await BluetoothSerial.list();
      const esp32 = devices.find((device) => device.name === "ESP32_PadelSensor");

      if (esp32) {
        await BluetoothSerial.connect(esp32.id);
        setIsConnected(true);
        return true;
      } else {
        throw new Error("ESP32 no encontrado");
      }
    } catch (error) {
      setError(error.message);
      setIsConnected(false);
      return false;
    }
  };

  const disconnect = async () => {
    try {
      await BluetoothSerial.disconnect();
      setIsConnected(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const setupDataListener = (callback) => {
    if (!isConnected) return;

    BluetoothSerial.onDataReceived((data) => {
      try {
        const parsedData = JSON.parse(data.data);
        callback(parsedData);
      } catch (error) {
        setError("Error al parsear datos del sensor");
      }
    });
  };

  return {
    isConnected,
    error,
    initializeBluetooth,
    disconnect,
    setupDataListener
  };
};