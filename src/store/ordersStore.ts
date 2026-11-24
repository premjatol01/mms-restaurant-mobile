import { create } from 'zustand';
import { playUrgentNewOrderFeedback, playOrderReadyFeedback, playTouchFeedback } from '../services/audio/soundService';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  notes?: string;
  isVegetarian?: boolean;
}

export interface KOTTicket {
  id: string;
  kotNo: string;
  tableNo: string;
  serverName: string;
  orderType: 'Dine-In' | 'Takeaway';
  status: 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  createdAt: number; // timestamp
}

const SAMPLE_ORDERS: KOTTicket[] = [
  {
    id: 'kot-101',
    kotNo: '#KOT-104',
    tableNo: 'Table 4',
    serverName: 'Pooja V. (Captain)',
    orderType: 'Dine-In',
    status: 'pending',
    createdAt: Date.now() - 3 * 60 * 1000, // 3 mins ago
    totalAmount: 890,
    items: [
      { id: 'i1', name: 'Paneer Butter Masala', quantity: 2, category: 'Main Course', notes: 'Medium spice, extra butter', isVegetarian: true },
      { id: 'i2', name: 'Butter Garlic Naan', quantity: 4, category: 'Breads', isVegetarian: true },
      { id: 'i3', name: 'Sweet Mango Lassi', quantity: 2, category: 'Beverages', isVegetarian: true },
    ],
  },
  {
    id: 'kot-102',
    kotNo: '#KOT-103',
    tableNo: 'Table 9',
    serverName: 'Amit P.',
    orderType: 'Dine-In',
    status: 'cooking',
    createdAt: Date.now() - 11 * 60 * 1000, // 11 mins ago
    totalAmount: 760,
    items: [
      { id: 'i4', name: 'Tandoori Chicken Full', quantity: 1, category: 'Starters', notes: 'Well done, crispy skin', isVegetarian: false },
      { id: 'i5', name: 'Tandoori Roti', quantity: 4, category: 'Breads', isVegetarian: true },
    ],
  },
  {
    id: 'kot-103',
    kotNo: '#KOT-102',
    tableNo: 'Table 2',
    serverName: 'Pooja V.',
    orderType: 'Dine-In',
    status: 'ready',
    createdAt: Date.now() - 17 * 60 * 1000, // 17 mins ago
    totalAmount: 480,
    items: [
      { id: 'i6', name: 'Dal Makhani Slow Cooked', quantity: 1, category: 'Main Course', isVegetarian: true },
      { id: 'i7', name: 'Jeera Basmati Rice', quantity: 2, category: 'Rice', isVegetarian: true },
    ],
  },
];

interface OrdersState {
  orders: KOTTicket[];
  activeFilter: 'all' | 'pending' | 'cooking' | 'ready';
  kitchenDisplayMode: boolean; // High-contrast tablet mode

  setActiveFilter: (filter: 'all' | 'pending' | 'cooking' | 'ready') => void;
  toggleKitchenDisplayMode: () => void;
  advanceStatus: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  simulateIncomingOrder: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: SAMPLE_ORDERS,
  activeFilter: 'all',
  kitchenDisplayMode: false,

  setActiveFilter: (filter) => {
    playTouchFeedback();
    set({ activeFilter: filter });
  },

  toggleKitchenDisplayMode: () => {
    playTouchFeedback();
    set((state) => ({ kitchenDisplayMode: !state.kitchenDisplayMode }));
  },

  advanceStatus: async (orderId: string) => {
    const target = get().orders.find((o) => o.id === orderId);
    if (!target) return;

    if (target.status === 'cooking') {
      await playOrderReadyFeedback();
    } else {
      await playTouchFeedback();
    }

    set((state) => ({
      orders: state.orders
        .map((ord) => {
          if (ord.id !== orderId) return ord;
          if (ord.status === 'pending') return { ...ord, status: 'cooking' as const };
          if (ord.status === 'cooking') return { ...ord, status: 'ready' as const };
          if (ord.status === 'ready') return { ...ord, status: 'served' as const };
          return ord;
        })
        .filter((ord) => ord.status !== 'served'), // Dispatched tickets leave active board
    }));
  },

  cancelOrder: async (orderId: string) => {
    await playTouchFeedback();
    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId ? { ...ord, status: 'cancelled' as const } : ord
      ),
    }));
  },

  simulateIncomingOrder: () => {
    playUrgentNewOrderFeedback();
    const tableNumbers = ['Table 1', 'Table 3', 'Table 6', 'Table 8', 'Table 10'];
    const randomTable = tableNumbers[Math.floor(Math.random() * tableNumbers.length)];
    const randomKotNum = Math.floor(105 + Math.random() * 50);

    const newTicket: KOTTicket = {
      id: `kot-${Date.now()}`,
      kotNo: `#KOT-${randomKotNum}`,
      tableNo: randomTable,
      serverName: 'Guest QR Order',
      orderType: 'Dine-In',
      status: 'pending',
      createdAt: Date.now(),
      totalAmount: 640,
      items: [
        { id: `sim-${Date.now()}-1`, name: 'Crispy Veg Spring Rolls', quantity: 2, category: 'Starters', notes: 'Extra sweet chili dip', isVegetarian: true },
        { id: `sim-${Date.now()}-2`, name: 'Cold Pressed Lime Soda', quantity: 2, category: 'Beverages', isVegetarian: true },
      ],
    };

    set((state) => ({
      orders: [newTicket, ...state.orders],
    }));
  },
}));
