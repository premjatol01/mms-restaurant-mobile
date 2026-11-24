import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playTouchFeedback, playOrderReadyFeedback } from '../services/audio/soundService';
import { useOrdersStore } from './ordersStore';

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
}

const STORAGE_KEY = 'tablly_mobile_floor_v1';

export const INITIAL_FLOOR_TABLES: FloorTable[] = [
  {
    id: 'tbl-1',
    number: 'T-01',
    section: 'Main Hall',
    capacity: 2,
    status: 'available',
    items: [],
    subtotal: 0,
  },
  {
    id: 'tbl-2',
    number: 'T-02',
    section: 'Main Hall',
    capacity: 4,
    status: 'occupied',
    guests: 3,
    serverName: 'Pooja V.',
    seatedAt: Date.now() - 35 * 60 * 1000,
    items: [
      { id: 'i1', name: 'Paneer Butter Masala', price: 320, quantity: 2, notes: 'Less spicy' },
      { id: 'i2', name: 'Butter Garlic Naan', price: 80, quantity: 4 },
      { id: 'i3', name: 'Sweet Mango Lassi', price: 120, quantity: 2 },
    ],
    subtotal: 1200,
  },
  {
    id: 'tbl-3',
    number: 'T-03',
    section: 'Main Hall',
    capacity: 4,
    status: 'available',
    items: [],
    subtotal: 0,
  },
  {
    id: 'tbl-4',
    number: 'T-04',
    section: 'Balcony',
    capacity: 6,
    status: 'occupied',
    guests: 5,
    serverName: 'Amit P.',
    seatedAt: Date.now() - 48 * 60 * 1000,
    items: [
      { id: 'i4', name: 'Tandoori Chicken Full', price: 480, quantity: 2 },
      { id: 'i5', name: 'Dal Makhani', price: 260, quantity: 2 },
      { id: 'i6', name: 'Jeera Rice', price: 160, quantity: 3 },
    ],
    subtotal: 1960,
  },
  {
    id: 'tbl-5',
    number: 'T-05',
    section: 'Balcony',
    capacity: 2,
    status: 'billed',
    guests: 2,
    serverName: 'Pooja V.',
    seatedAt: Date.now() - 70 * 60 * 1000,
    items: [
      { id: 'i7', name: 'Dal Makhani', price: 260, quantity: 1 },
      { id: 'i8', name: 'Butter Naan', price: 60, quantity: 3 },
      { id: 'i9', name: 'Gulab Jamun', price: 160, quantity: 2 },
    ],
    subtotal: 760,
  },
  {
    id: 'tbl-6',
    number: 'T-06',
    section: 'Outdoor',
    capacity: 4,
    status: 'available',
    items: [],
    subtotal: 0,
  },
  {
    id: 'tbl-7',
    number: 'T-07',
    section: 'Outdoor',
    capacity: 8,
    status: 'occupied',
    guests: 7,
    serverName: 'Pooja V.',
    seatedAt: Date.now() - 22 * 60 * 1000,
    items: [
      { id: 'i10', name: 'Mutton Rogan Josh', price: 540, quantity: 2 },
      { id: 'i11', name: 'Crispy Veg Spring Rolls', price: 220, quantity: 3 },
      { id: 'i12', name: 'Butter Garlic Naan', price: 80, quantity: 6 },
    ],
    subtotal: 2220,
  },
  {
    id: 'tbl-8',
    number: 'T-08',
    section: 'Outdoor',
    capacity: 4,
    status: 'available',
    items: [],
    subtotal: 0,
  },
];

interface FloorState {
  tables: FloorTable[];
  sectionFilter: string;
  statusFilter: string;

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

  setSectionFilter: (sectionFilter) => {
    playTouchFeedback();
    set({ sectionFilter });
  },

  setStatusFilter: (statusFilter) => {
    playTouchFeedback();
    set({ statusFilter });
  },

  loadTables: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ tables: JSON.parse(stored) });
      }
    } catch (e) {
      console.warn('Failed loading floor tables:', e);
    }
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
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Also automatically dispatch a live KOT ticket to kitchen ordersStore!
    const ordersStore = useOrdersStore.getState();
    const newKOT = {
      id: `kot-${Date.now()}`,
      kotNo: `#KOT-${Math.floor(110 + Math.random() * 50)}`,
      tableNo: table.number,
      serverName: table.serverName || 'Waiter Station',
      orderType: 'Dine-In' as const,
      status: 'pending' as const,
      createdAt: Date.now(),
      totalAmount: addedTotal,
      items: newItems.map((i, idx) => ({
        id: `kot-item-${Date.now()}-${idx}`,
        name: i.name,
        quantity: i.quantity,
        category: i.category || 'Main Course',
        notes: i.notes,
      })),
    };

    useOrdersStore.setState({ orders: [newKOT, ...ordersStore.orders] });
  },

  requestBill: async (tableId) => {
    playTouchFeedback();
    const updated = get().tables.map((t) => {
      if (t.id !== tableId) return t;
      return { ...t, status: 'billed' as const };
    });

    set({ tables: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  settleAndClearTable: async (tableId) => {
    playTouchFeedback();
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
      };
    });

    set({ tables: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },
}));
