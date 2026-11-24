import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playUrgentNewOrderFeedback, playTouchFeedback } from '../services/audio/soundService';

export interface ServiceCall {
  id: string;
  tableNo: string;
  type: 'water' | 'bill' | 'steward';
  label: string;
  detail?: string;
  createdAt: number;
}

const STORAGE_KEY = 'tablly_mobile_calls_v1';

const INITIAL_SERVICE_CALLS: ServiceCall[] = [
  {
    id: 'call-1',
    tableNo: 'Table 4',
    type: 'water',
    label: 'Drinking Water requested',
    detail: '2 regular, 1 warm water',
    createdAt: Date.now() - 2 * 60 * 1000,
  },
  {
    id: 'call-2',
    tableNo: 'Table 5',
    type: 'bill',
    label: 'Final Bill settlement requested',
    detail: 'Wants to pay via UPI QR',
    createdAt: Date.now() - 6 * 60 * 1000,
  },
  {
    id: 'call-3',
    tableNo: 'Table 2',
    type: 'steward',
    label: 'Captain assistance needed',
    detail: 'Needs cutlery & dessert recommendation',
    createdAt: Date.now() - 9 * 60 * 1000,
  },
];

interface WaiterCallsState {
  calls: ServiceCall[];
  filterType: 'all' | 'water' | 'bill' | 'steward';

  loadCalls: () => Promise<void>;
  setFilterType: (filter: 'all' | 'water' | 'bill' | 'steward') => void;
  dismissCall: (id: string) => Promise<void>;
  simulateGuestCall: () => void;
}

export const useWaiterCallsStore = create<WaiterCallsState>((set, get) => ({
  calls: INITIAL_SERVICE_CALLS,
  filterType: 'all',

  setFilterType: (filterType) => {
    playTouchFeedback();
    set({ filterType });
  },

  loadCalls: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ calls: JSON.parse(stored) });
      }
    } catch (e) {
      console.warn('Failed loading waiter calls:', e);
    }
  },

  dismissCall: async (id: string) => {
    playTouchFeedback();
    const updated = get().calls.filter((c) => c.id !== id);
    set({ calls: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  simulateGuestCall: () => {
    playUrgentNewOrderFeedback();
    const tables = ['Table 1', 'Table 3', 'Table 6', 'Table 7', 'Table 8'];
    const randomTable = tables[Math.floor(Math.random() * tables.length)];

    const requestOptions = [
      { type: 'water' as const, label: 'Drinking Water requested', detail: 'Fresh chilled bottle requested' },
      { type: 'bill' as const, label: 'Requested Bill Slip', detail: 'Paying cash at table' },
      { type: 'steward' as const, label: 'Captain assistance called', detail: 'Query about chef special' },
    ];
    const picked = requestOptions[Math.floor(Math.random() * requestOptions.length)];

    const newCall: ServiceCall = {
      id: `call-${Date.now()}`,
      tableNo: randomTable,
      type: picked.type,
      label: picked.label,
      detail: picked.detail,
      createdAt: Date.now(),
    };

    set((state) => ({
      calls: [newCall, ...state.calls],
    }));
  },
}));
