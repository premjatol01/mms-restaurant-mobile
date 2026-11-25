import { create } from 'zustand';
import { playUrgentNewOrderFeedback, playOrderReadyFeedback, playTouchFeedback } from '../services/audio/soundService';
import { apiClient } from '../services/api/client';

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

export const FALLBACK_SAMPLE_ORDERS: KOTTicket[] = [];

interface OrdersState {
  orders: KOTTicket[];
  activeFilter: 'all' | 'pending' | 'cooking' | 'ready';
  kitchenDisplayMode: boolean;
  isLoading: boolean;
  isLiveApi: boolean;

  loadOrders: () => Promise<void>;
  setActiveFilter: (filter: 'all' | 'pending' | 'cooking' | 'ready') => void;
  toggleKitchenDisplayMode: () => void;
  advanceStatus: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: FALLBACK_SAMPLE_ORDERS,
  activeFilter: 'all',
  kitchenDisplayMode: false,
  isLoading: false,
  isLiveApi: false,

  setActiveFilter: (filter) => {
    playTouchFeedback();
    set({ activeFilter: filter });
  },

  toggleKitchenDisplayMode: () => {
    playTouchFeedback();
    set((state) => ({ kitchenDisplayMode: !state.kitchenDisplayMode }));
  },

  loadOrders: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/orders');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const rawOrders = response.data.data;
        const liveOrders: KOTTicket[] = rawOrders.map((o: any) => ({
          id: o._id,
          kotNo: o.orderNumber || `#${o._id.slice(-4).toUpperCase()}`,
          tableNo: o.tableId?.tableNo ? `Table ${o.tableId.tableNo}` : (o.tableId?.tableId || 'Table'),
          serverName: o.customer?.name || (o.source === 'qr' ? 'Self (QR)' : 'Captain'),
          orderType: 'Dine-In',
          status: o.status || 'pending',
          createdAt: o.createdAt ? new Date(o.createdAt).getTime() : Date.now(),
          totalAmount: o.total || 0,
          items: (o.items || []).map((it: any) => ({
            id: it._id || String(Math.random()),
            name: it.name,
            quantity: it.quantity || 1,
            category: it.category || 'Dishes',
            notes: it.notes,
            isVegetarian: it.isVegetarian ?? true,
          })),
        }));

        set({ orders: liveOrders, isLiveApi: true, isLoading: false });
        return;
      }
    } catch (e) {
      // Backend offline fallback
    }

    set({ isLoading: false });
  },

  advanceStatus: async (orderId: string) => {
    const target = get().orders.find((o) => o.id === orderId);
    if (!target) return;

    let nextStatus: KOTTicket['status'] = 'cooking';
    if (target.status === 'pending') {
      nextStatus = 'cooking';
      playTouchFeedback();
    } else if (target.status === 'cooking') {
      nextStatus = 'ready';
      playOrderReadyFeedback();
    } else if (target.status === 'ready') {
      nextStatus = 'served';
      playTouchFeedback();
    } else {
      return;
    }

    // Optimistically update local UI
    const updated = get().orders.map((o) =>
      o.id === orderId ? { ...o, status: nextStatus } : o
    );
    set({ orders: updated });

    // Sync status change with real backend
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status: nextStatus });
    } catch (e) {
      console.warn('Failed to sync order status to server:', e);
    }
  },

  cancelOrder: async (orderId: string, reason?: string) => {
    playTouchFeedback();
    const updated = get().orders.map((o) =>
      o.id === orderId ? { ...o, status: 'cancelled' as const } : o
    );
    set({ orders: updated });

    try {
      await apiClient.put(`/orders/${orderId}/status`, { status: 'cancelled', reason });
    } catch (e) {
      console.warn('Failed to sync cancellation to server:', e);
    }
  },
}));
