import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, DEFAULT_API_URL } from '../services/api/client';
import { PRESET_ROLES, ALL_PERMISSION_IDS } from '../constants/roles';

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
  loginAsDemoRole: (roleId: string) => Promise<void>;
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
        const user = JSON.parse(userRaw);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch (e) {
      // Safe fallback if storage isn't initialized yet
    }
    set({ isLoading: false });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const trimmedEmail = email.trim().toLowerCase();

    try {
      // 1. Try real backend login
      const response = await apiClient.post('/auth/login', { email: trimmedEmail, password });
      if (response.data?.success) {
        const { user: rawUser, token } = response.data.data;
        
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

        try {
          await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
          await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
        } catch {}

        set({ user, token, isAuthenticated: true, isLoading: false });
        return true;
      }
      throw new Error(response.data?.message || 'Invalid credentials');
    } catch (err: any) {
      // If network fails (e.g. backend server on port 5000 is not running),
      // seamlessly match role by email so developer/staff can test immediately!
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network');
      
      if (isNetworkError) {
        let detectedRoleId = 'admin';
        if (trimmedEmail.includes('waiter') || trimmedEmail.includes('captain')) detectedRoleId = 'waiter';
        else if (trimmedEmail.includes('chef') || trimmedEmail.includes('kitchen')) detectedRoleId = 'kitchen';
        else if (trimmedEmail.includes('cashier')) detectedRoleId = 'cashier';
        else if (trimmedEmail.includes('manager')) detectedRoleId = 'manager';

        const matchedRole = PRESET_ROLES.find(r => r.id === detectedRoleId) || PRESET_ROLES[0];
        const demoUser: UserProfile = {
          _id: `offline_${detectedRoleId}_${Date.now()}`,
          name: `${matchedRole.name} (Offline Station)`,
          email: trimmedEmail,
          role: detectedRoleId as any,
          roleName: matchedRole.name,
          permissions: matchedRole.permissions,
          restaurantId: 'tablly_bistro_001',
          restaurantName: 'Tablly Grand Bistro',
        };

        const demoToken = `offline_token_${detectedRoleId}`;
        try {
          await AsyncStorage.setItem(STORAGE_TOKEN_KEY, demoToken);
          await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(demoUser));
        } catch {}

        set({ user: demoUser, token: demoToken, isAuthenticated: true, isLoading: false, error: null });
        return true;
      }

      const message = err.response?.data?.message || err.message || 'Login failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  // Instant one-tap demo switcher for testing all roles
  loginAsDemoRole: async (roleId: string) => {
    set({ isLoading: true, error: null });
    const targetRole = PRESET_ROLES.find(r => r.id === roleId) || PRESET_ROLES[0];

    const demoUser: UserProfile = {
      _id: `demo_${roleId}_${Date.now()}`,
      name: `${targetRole.name} (Demo)`,
      email: `${roleId}@tablly.demo`,
      role: roleId as any,
      roleName: targetRole.name,
      permissions: targetRole.permissions,
      restaurantId: 'demo_restaurant_001',
      restaurantName: 'Tablly Grand Bistro',
    };

    const demoToken = `demo_jwt_token_${roleId}`;
    try {
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, demoToken);
      await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(demoUser));
    } catch {}

    set({ user: demoUser, token: demoToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
      await AsyncStorage.removeItem(STORAGE_USER_KEY);
    } catch {}
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },
}));
