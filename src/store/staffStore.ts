import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRESET_ROLES, PresetRole } from '../constants/roles';

export interface MobileStaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  roleColor: string;
  status: 'active' | 'suspended' | 'pending_activation';
  permissions: string[];
  invitedAt: string;
  lastLoginAt: string | null;
  isOwner?: boolean;
}

const STORAGE_KEY = 'tablly_mobile_staff_v1';

export const INITIAL_STAFF_MEMBERS: MobileStaffMember[] = [
  {
    id: 'staff-1',
    name: 'Karan Sharma',
    email: 'karan@tablly.com',
    phone: '+91 98765 43210',
    roleId: 'admin',
    roleName: 'Restaurant Admin',
    roleColor: '#D9480F',
    status: 'active',
    permissions: PRESET_ROLES[0].permissions,
    invitedAt: '2026-10-01T10:00:00.000Z',
    lastLoginAt: '2026-11-24T20:30:00.000Z',
    isOwner: true,
  },
  {
    id: 'staff-2',
    name: 'Rajesh Kumar',
    email: 'rajesh.chef@tablly.com',
    phone: '+91 98111 22334',
    roleId: 'kitchen',
    roleName: 'Head Chef / KDS',
    roleColor: '#D97706',
    status: 'active',
    permissions: PRESET_ROLES[2].permissions,
    invitedAt: '2026-10-15T14:20:00.000Z',
    lastLoginAt: '2026-11-24T18:15:00.000Z',
  },
  {
    id: 'staff-3',
    name: 'Pooja Verma',
    email: 'pooja.waiter@tablly.com',
    phone: '+91 97222 33445',
    roleId: 'waiter',
    roleName: 'Floor Captain',
    roleColor: '#059669',
    status: 'active',
    permissions: PRESET_ROLES[3].permissions,
    invitedAt: '2026-11-01T09:45:00.000Z',
    lastLoginAt: '2026-11-24T21:05:00.000Z',
  },
  {
    id: 'staff-4',
    name: 'Amit Patel',
    email: 'amit.cashier@tablly.com',
    phone: '+91 96333 44556',
    roleId: 'cashier',
    roleName: 'Counter Cashier',
    roleColor: '#7C3AED',
    status: 'active',
    permissions: PRESET_ROLES[4].permissions,
    invitedAt: '2026-11-05T11:10:00.000Z',
    lastLoginAt: '2026-11-24T19:50:00.000Z',
  },
  {
    id: 'staff-5',
    name: 'Vikram Singh',
    email: 'vikram.mgr@tablly.com',
    phone: '+91 95444 55667',
    roleId: 'manager',
    roleName: 'Floor Manager',
    roleColor: '#2563EB',
    status: 'pending_activation',
    permissions: PRESET_ROLES[1].permissions,
    invitedAt: '2026-11-23T16:00:00.000Z',
    lastLoginAt: null,
  },
];

interface StaffState {
  staffMembers: MobileStaffMember[];
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  isLoading: boolean;

  // Actions
  loadStaff: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: string) => void;
  setStatusFilter: (status: string) => void;
  getMemberById: (id: string) => MobileStaffMember | undefined;
  inviteMember: (data: {
    name: string;
    email: string;
    phone?: string;
    roleId: string;
    permissions?: string[];
  }) => Promise<MobileStaffMember>;
  updateMember: (id: string, updates: Partial<MobileStaffMember>) => Promise<void>;
  toggleMemberStatus: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staffMembers: INITIAL_STAFF_MEMBERS,
  searchQuery: '',
  roleFilter: 'all',
  statusFilter: 'all',
  isLoading: false,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  loadStaff: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ staffMembers: JSON.parse(stored) });
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STAFF_MEMBERS));
      }
    } catch (e) {
      console.warn('Failed to load staff from storage:', e);
    }
  },

  getMemberById: (id: string) => {
    return get().staffMembers.find((m) => m.id === id);
  },

  inviteMember: async ({ name, email, phone = '', roleId, permissions }) => {
    set({ isLoading: true });
    const matchedRole = PRESET_ROLES.find((r) => r.id === roleId) || PRESET_ROLES[3];
    const finalPermissions = permissions && permissions.length > 0 ? permissions : matchedRole.permissions;

    const newMember: MobileStaffMember = {
      id: `staff-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+91 98000 00000',
      roleId: matchedRole.id,
      roleName: matchedRole.name,
      roleColor: matchedRole.color,
      status: 'pending_activation',
      permissions: finalPermissions,
      invitedAt: new Date().toISOString(),
      lastLoginAt: null,
      isOwner: false,
    };

    const updated = [newMember, ...get().staffMembers];
    set({ staffMembers: updated, isLoading: false });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newMember;
  },

  updateMember: async (id: string, updates: Partial<MobileStaffMember>) => {
    const updated = get().staffMembers.map((m) => {
      if (m.id !== id) return m;
      let roleName = m.roleName;
      let roleColor = m.roleColor;

      if (updates.roleId) {
        const r = PRESET_ROLES.find((preset) => preset.id === updates.roleId);
        if (r) {
          roleName = r.name;
          roleColor = r.color;
        }
      }

      return {
        ...m,
        ...updates,
        roleName,
        roleColor,
      };
    });

    set({ staffMembers: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  toggleMemberStatus: async (id: string) => {
    const updated = get().staffMembers.map((m) => {
      if (m.id !== id) return m;
      const newStatus = m.status === 'active' ? 'suspended' : 'active';
      return { ...m, status: newStatus as any };
    });

    set({ staffMembers: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  deleteMember: async (id: string) => {
    const updated = get().staffMembers.filter((m) => m.id !== id);
    set({ staffMembers: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
}));
