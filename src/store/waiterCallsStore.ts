import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playUrgentNewOrderFeedback, playTouchFeedback } from '../services/audio/soundService';
import { apiClient } from '../services/api/client';

export interface ServiceCall {
  id: string;
  tableId?: string;
  tableNo: string;
  type: 'water' | 'bill' | 'steward';
  label: string;
  detail?: string;
  createdAt: number;
}

const STORAGE_KEY = 'tablly_mobile_calls_v1';

const INITIAL_SERVICE_CALLS: ServiceCall[] = [];

interface WaiterCallsState {
  calls: ServiceCall[];
  filterType: 'all' | 'water' | 'bill' | 'steward';

  loadCalls: () => Promise<void>;
  setFilterType: (filter: 'all' | 'water' | 'bill' | 'steward') => void;
  dismissCall: (id: string, staffName?: string) => Promise<void>;
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

  dismissCall: async (id: string, staffName?: string) => {
    playTouchFeedback();
    const targetCall = get().calls.find((c) => c.id === id);
    const updated = get().calls.filter((c) => c.id !== id);
    set({ calls: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Notify backend and customer table room
    if (targetCall?.tableId) {
      try {
        await apiClient.post('/orders/waiter/acknowledge', {
          tableId: targetCall.tableId,
          staffName: staffName || undefined,
        });
      } catch (err) {
        // Non-blocking log
        console.warn('Could not post waiter acknowledgment:', err);
      }
    }
  },
}));
