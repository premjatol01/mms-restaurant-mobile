import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api/client';
import { PRESET_ROLES } from '../constants/roles';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'restaurant_admin' | 'manager' | 'kitchen' | 'waiter' | 'cashier' | 'custom';
  roleName: string;
  permissions: string[];
  restaurantId?: string;
  restaurantName?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

const STORAGE_TOKEN_KEY = 'tablly_mobile_token';
const STORAGE_USER_KEY = 'tablly_mobile_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  restoreSession: async () => {
    try {
      const [token, userRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_TOKEN_KEY).catch(() => null),
        AsyncStorage.getItem(STORAGE_USER_KEY).catch(() => null),
      ]);

      if (token && userRaw) {
        // Do not restore offline/demo tokens
        if (token.startsWith('offline_') || token.startsWith('demo_')) {
          await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
          await AsyncStorage.removeItem(STORAGE_USER_KEY);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          return;
        }

        const user = JSON.parse(userRaw);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch (e) {
      // Safe fallback
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const trimmedEmail = email.trim().toLowerCase();

    try {
      // Authenticate strictly against the live database API
      const response = await apiClient.post('/auth/login', { email: trimmedEmail, password });
      if (response.data?.success && response.data?.data) {
        const { user: rawUser, token } = response.data.data;

        if (!token) {
          throw new Error('Authentication token not received');
        }

        const matchedRole = PRESET_ROLES.find(r => r.id === rawUser.role) || PRESET_ROLES[0];

        let restaurantName = rawUser.restaurantName || 'My Restaurant';
        try {
          const profRes = await apiClient.get('/restaurant/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (profRes.data?.success && profRes.data.data?.name) {
            restaurantName = profRes.data.data.name;
          }
        } catch {}

        const user: UserProfile = {
          _id: rawUser._id,
          name: rawUser.name,
          email: rawUser.email,
          role: rawUser.role === 'restaurant_admin' ? 'admin' : rawUser.role,
          roleName: matchedRole.name,
          permissions: rawUser.permissions || matchedRole.permissions,
          restaurantId: rawUser.restaurantId,
          restaurantName,
        };

        await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));

        set({ user, token, isAuthenticated: true, isLoading: false, error: null });
        return true;
      }

      throw new Error(response.data?.message || 'Invalid credentials');
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Network error: Cannot reach authentication server'
          : err.message || 'Login failed. Please verify your credentials.');

      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
      await AsyncStorage.removeItem(STORAGE_USER_KEY);
    } catch {}
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
  },
}));
