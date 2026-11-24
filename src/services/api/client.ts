import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For local testing:
// - Physical device (Expo Go): Replace with your PC's local IP (e.g. http://192.168.1.5:5000)
// - Android Emulator: http://10.0.2.2:5000
// - Production: https://api.tablly.com
export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  default: 'http://localhost:5000/api',
});

export const apiClient = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('tablly_mobile_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading auth token for request', e);
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
      // Clear token on token expiration/invalidation
      try {
        await AsyncStorage.removeItem('tablly_mobile_token');
        await AsyncStorage.removeItem('tablly_mobile_user');
      } catch {}
    }
    return Promise.reject(error);
  }
);
