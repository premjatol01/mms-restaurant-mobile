import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Tablly Backend API URL:
 * - Production cloud backend on Render: https://mms-api-backend.onrender.com/api
 * - Local fallback (if local backend is explicitly running on port 5000)
 */
export const RENDER_CLOUD_API_URL = 'https://mms-api-backend.onrender.com/api';

export const getBackendBaseUrl = (): string => {
  // Always use the live Render Cloud backend so real database data loads on mobile
  return RENDER_CLOUD_API_URL;
};

export const DEFAULT_API_URL = getBackendBaseUrl();

export const apiClient = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 15000,
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
      // Safe fallback
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
