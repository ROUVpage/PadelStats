import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

/**
 * Obtiene un deviceId multiplataforma (web/native).
 * Para web usa localStorage, para nativo usa DeviceInfo.
 */
export const getDeviceId = async () => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
          deviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
      }
      return `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
      return `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  } else {
    try {
      return await DeviceInfo.getUniqueId();
    } catch (error) {
      return `native-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }
};
