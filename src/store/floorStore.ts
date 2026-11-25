import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playTouchFeedback, playOrderReadyFeedback } from '../services/audio/soundService';
import { apiClient } from '../services/api/client';

export interface TableItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface FloorTable {
  id: string;
  number: string;
  section: string; // e.g. 'Main Hall', 'Balcony', 'Outdoor'
  capacity: number;
  status: 'available' | 'occupied' | 'billed';
  guests?: number;
  serverName?: string;
  seatedAt?: number;
  items: TableItem[];
  subtotal: number;
  sessionId?: string;
}

const STORAGE_KEY = 'tablly_mobile_floor_v1';

export const INITIAL_FLOOR_TABLES: FloorTable[] = [
  { id: 'tbl-1', number: 'T-01', section: 'Main Hall', capacity: 2, status: 'available', items: [], subtotal: 0 },
  { id: 'tbl-2', number: 'T-02', section: 'Main Hall', capacity: 4, status: 'available', items: [], subtotal: 0 },
  { id: 'tbl-3', number: 'T-03', section: 'Main Hall', capacity: 4, status: 'available', items: [], subtotal: 0 },
  { id: 'tbl-4', number: 'T-04', section: 'Main Hall', capacity: 6, status: 'available', items: [], subtotal: 0 },
  { id: 'tbl-5', number: 'T-05', section: 'Balcony', capacity: 2, status: 'available', items: [], subtotal: 0 },
  { id: 'tbl-6', number: 'T-06', section: 'Balcony', capacity: 4, status: 'available', items: [], subtotal: 0 },
  { id: 'tbl-7', number: 'T-07', section: 'Outdoor', capacity: 6, status: 'available', items: [], subtotal: 0 },
  { id: 'tbl-8', number: 'T-08', section: 'Outdoor', capacity: 4, status: 'available', items: [], subtotal: 0 },
];

interface FloorState {
  tables: FloorTable[];
  sectionFilter: string;
  statusFilter: string;
  isLoading: boolean;
  isLiveApi: boolean;

  loadTables: () => Promise<void>;
  setSectionFilter: (sec: string) => void;
  setStatusFilter: (status: string) => void;
  seatGuests: (tableId: string, pax: number, serverName?: string) => Promise<void>;
  addItemsToTable: (
    tableId: string,
    newItems: { name: string; price: number; quantity: number; notes?: string; category?: string }[]
  ) => Promise<void>;
  requestBill: (tableId: string) => Promise<void>;
  settleAndClearTable: (tableId: string) => Promise<void>;
}

export const useFloorStore = create<FloorState>((set, get) => ({
  tables: INITIAL_FLOOR_TABLES,
  sectionFilter: 'all',
  statusFilter: 'all',
  isLoading: false,
  isLiveApi: false,

  setSectionFilter: (sectionFilter) => {
    playTouchFeedback();
    set({ sectionFilter });
  },

  setStatusFilter: (statusFilter) => {
    playTouchFeedback();
    set({ statusFilter });
  },

  loadTables: async () => {
    set({ isLoading: true });
    try {
      // 1. Fetch live tables from backend
      const tablesRes = await apiClient.get('/restaurant/tables');
      if (tablesRes.data?.success && Array.isArray(tablesRes.data.data) && tablesRes.data.data.length > 0) {
        const rawTables = tablesRes.data.data;

        // 2. Fetch live active sessions to see which tables are occupied or billed
        let activeSessions: any[] = [];
        try {
          const sessionsRes = await apiClient.get('/orders/sessions?status=active');
          if (sessionsRes.data?.success && Array.isArray(sessionsRes.data.data)) {
            activeSessions = sessionsRes.data.data;
          }
        } catch {}

        const liveFloorTables: FloorTable[] = rawTables.map((t: any) => {
          const matchedSession = activeSessions.find(
            (s: any) => String(s.tableId?._id || s.tableId?.id || s.tableId) === String(t._id)
          );

          if (matchedSession) {
            const sessionItems: TableItem[] = (matchedSession.orderIds || []).flatMap((ord: any) =>
              (ord.items || []).map((it: any) => ({
                id: it._id || String(Math.random()),
                name: it.name,
                price: it.price || 0,
                quantity: it.quantity || 1,
                notes: it.notes,
              }))
            );

            return {
              id: t._id,
              number: t.tableNo || t.tableId || `T-${t.number || '01'}`,
              section: t.section || 'Main Hall',
              capacity: Number(t.capacity) || 4,
              status: matchedSession.paymentStatus === 'requested' ? 'billed' : 'occupied',
              guests: matchedSession.guests || t.capacity || 2,
              serverName: matchedSession.customerName || 'Captain',
              seatedAt: matchedSession.startedAt ? new Date(matchedSession.startedAt).getTime() : Date.now(),
              items: sessionItems,
              subtotal: matchedSession.total || matchedSession.subtotal || 0,
              sessionId: matchedSession._id,
            };
          }

          return {
            id: t._id,
            number: t.tableNo || t.tableId || `T-${t.number || '01'}`,
            section: t.section || 'Main Hall',
            capacity: Number(t.capacity) || 4,
            status: 'available',
            items: [],
            subtotal: 0,
          };
        });

        set({ tables: liveFloorTables, isLiveApi: true, isLoading: false });
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(liveFloorTables));
        } catch {}
        return;
      }
    } catch (e) {
      // Backend offline or local fallback
    }

    // Fallback to locally cached storage
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ tables: JSON.parse(stored), isLiveApi: false, isLoading: false });
        return;
      }
    } catch {}

    set({ isLoading: false });
  },

  seatGuests: async (tableId, pax, serverName = 'Floor Staff') => {
    playTouchFeedback();
    const updated = get().tables.map((t) => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        status: 'occupied' as const,
        guests: pax,
        serverName,
        seatedAt: Date.now(),
        items: [],
        subtotal: 0,
      };
    });

    set({ tables: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  addItemsToTable: async (tableId, newItems) => {
    playOrderReadyFeedback();
    const table = get().tables.find((t) => t.id === tableId);
    if (!table) return;

    const formattedItems: TableItem[] = newItems.map((item, idx) => ({
      id: `it-${Date.now()}-${idx}`,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
    }));

    const addedTotal = newItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

    const updated = get().tables.map((t) => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        items: [...t.items, ...formattedItems],
        subtotal: t.subtotal + addedTotal,
      };
    });

    set({ tables: updated });

    // Also sync to real backend orders if connected
    try {
      await apiClient.post('/orders/manual', {
        tableId,
        items: newItems,
        total: addedTotal,
      });
    } catch {}

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  requestBill: async (tableId) => {
    playTouchFeedback();
    const table = get().tables.find((t) => t.id === tableId);
    const updated = get().tables.map((t) =>
      t.id === tableId ? { ...t, status: 'billed' as const } : t
    );
    set({ tables: updated });

    if (table?.sessionId) {
      try {
        await apiClient.post(`/orders/sessions/${table.sessionId}/bill`);
      } catch {}
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  settleAndClearTable: async (tableId) => {
    playOrderReadyFeedback();
    const table = get().tables.find((t) => t.id === tableId);
    const updated = get().tables.map((t) => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        status: 'available' as const,
        guests: undefined,
        serverName: undefined,
        seatedAt: undefined,
        items: [],
        subtotal: 0,
        sessionId: undefined,
      };
    });

    set({ tables: updated });

    if (table?.sessionId) {
      try {
        await apiClient.post(`/orders/sessions/${table.sessionId}/end`);
      } catch {}
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },
}));
