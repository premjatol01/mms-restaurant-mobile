import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api/client';
import { PRESET_ROLES } from '../constants/roles';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  isOwner: boolean;
  isStaff: boolean;
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

        const isStaff = Boolean(rawUser.isStaff);
        const isOwner = rawUser.isOwner !== undefined ? Boolean(rawUser.isOwner) : !isStaff;
        const roleId = rawUser.roleId || (isStaff ? 'manager' : (rawUser.role === 'restaurant_admin' ? 'admin' : rawUser.role));

        // Lookup matching preset role to get fallback label or permissions if none defined
        const matchedPreset = PRESET_ROLES.find(r => r.id === roleId);

        let restaurantName = rawUser.restaurantName || 'My Restaurant';
        try {
          const profRes = await apiClient.get('/restaurant/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (profRes.data?.success && profRes.data.data?.name) {
            restaurantName = profRes.data.data.name;
          }
        } catch {}

        const roleName = rawUser.roleName || matchedPreset?.name || (isOwner ? 'Restaurant Admin' : 'Staff Member');
        const permissions: string[] = Array.isArray(rawUser.permissions) && rawUser.permissions.length > 0
          ? rawUser.permissions
          : (isOwner ? (matchedPreset?.permissions || []) : (matchedPreset?.permissions || []));

        const user: UserProfile = {
          _id: rawUser._id,
          name: rawUser.name,
          email: rawUser.email,
          role: rawUser.role || 'restaurant_admin',
          roleId,
          roleName,
          permissions,
          isOwner,
          isStaff,
          restaurantId: rawUser.restaurantId,
          restaurantName,
        };

        await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));

        set({ user, token, isAuthenticated: true, isLoading: false, error: null });

        // Register mobile device for lock-screen push notifications
        import('../services/notifications/pushNotificationService')
          .then((mod) => mod.registerForPushNotificationsAsync())
          .catch(() => {});

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
