import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Automatically determine the correct backend URL:
 * - If running in Expo Go on a physical phone, extract the host PC IP from Constants.expoConfig
 * - Fallback to current local Wi-Fi IP (10.222.18.6)
 * - If in Android Studio emulator, use 10.0.2.2
 */
export const getBackendBaseUrl = (): string => {
  // If running via Expo Metro, hostUri is "IP:PORT" (e.g. "10.222.18.6:8081")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    return `http://${hostIp}:5000/api`;
  }

  // Fallback for physical device on current network
  if (Platform.OS === 'android') {
    return 'http://10.222.18.6:5000/api';
  }

  return 'http://localhost:5000/api';
};

export const DEFAULT_API_URL = getBackendBaseUrl();

export const apiClient = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every request with safe error recovery
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('tablly_mobile_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Safe fallback - do not block the request
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('tablly_mobile_token');
        await AsyncStorage.removeItem('tablly_mobile_user');
      } catch {}
    }
    return Promise.reject(error);
  }
);
