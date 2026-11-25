import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playOrderReadyFeedback, playTouchFeedback } from '../services/audio/soundService';
import { useFloorStore, TableItem } from './floorStore';
import { apiClient } from '../services/api/client';

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  tableId: string;
  tableNo: string;
  serverName: string;
  cashierName: string;
  items: TableItem[];
  subtotal: number;
  discount: number;
  gstAmount: number;
  total: number;
  paymentMode: 'Cash' | 'UPI' | 'Card';
  amountTendered?: number;
  changeReturned?: number;
  settledAt: number;
}

const STORAGE_KEY = 'tablly_mobile_settlements_v1';

export const INITIAL_SETTLED_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-1048',
    tableId: 'tbl-prev-1',
    tableNo: 'Table 3',
    serverName: 'Captain',
    cashierName: 'POS Cashier',
    subtotal: 1450,
    discount: 100,
    gstAmount: 67.5,
    total: 1417.5,
    paymentMode: 'UPI',
    settledAt: Date.now() - 45 * 60 * 1000,
    items: [
      { id: '1', name: 'Paneer Butter Masala', price: 320, quantity: 2 },
      { id: '2', name: 'Butter Naan', price: 60, quantity: 5 },
    ],
  },
];

interface BillingState {
  settledInvoices: InvoiceRecord[];
  activeTab: 'unpaid' | 'history';
  paymentModeFilter: string;
  isLoading: boolean;
  isLiveApi: boolean;

  loadSettlements: () => Promise<void>;
  setActiveTab: (tab: 'unpaid' | 'history') => void;
  setPaymentModeFilter: (mode: string) => void;
  settleInvoice: (data: {
    tableId: string;
    tableNo: string;
    serverName: string;
    cashierName: string;
    items: TableItem[];
    subtotal: number;
    discount: number;
    gstAmount: number;
    total: number;
    paymentMode: 'Cash' | 'UPI' | 'Card';
    amountTendered?: number;
    changeReturned?: number;
  }) => Promise<InvoiceRecord>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  settledInvoices: INITIAL_SETTLED_INVOICES,
  activeTab: 'unpaid',
  paymentModeFilter: 'all',
  isLoading: false,
  isLiveApi: false,

  setActiveTab: (activeTab) => {
    playTouchFeedback();
    set({ activeTab });
  },

  setPaymentModeFilter: (paymentModeFilter) => {
    playTouchFeedback();
    set({ paymentModeFilter });
  },

  loadSettlements: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/orders/sessions');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const rawSessions = response.data.data;
        const paidSessions = rawSessions.filter(
          (s: any) => s.paymentStatus === 'paid' || s.status === 'completed'
        );

        if (paidSessions.length > 0) {
          const liveInvoices: InvoiceRecord[] = paidSessions.map((s: any) => ({
            id: s._id,
            invoiceNo: s.sessionNumber
              ? `INV-${s.sessionNumber.replace('#', '')}`
              : `INV-${s._id.slice(-6).toUpperCase()}`,
            tableId: s.tableId?._id || s.tableId?.id || s.tableId,
            tableNo: s.tableId?.tableNo ? `Table ${s.tableId.tableNo}` : (s.tableId?.tableId || 'Table'),
            serverName: s.customerName || 'Captain',
            cashierName: 'POS Counter',
            items: (s.orderIds || []).flatMap((ord: any) =>
              (ord.items || []).map((it: any) => ({
                id: it._id || String(Math.random()),
                name: it.name,
                price: it.price || 0,
                quantity: it.quantity || 1,
              }))
            ),
            subtotal: s.subtotal || 0,
            discount: s.discount || 0,
            gstAmount: s.gst || 0,
            total: s.total || 0,
            paymentMode: s.paymentMode || 'UPI',
            settledAt: s.endedAt ? new Date(s.endedAt).getTime() : Date.now(),
          }));

          set({ settledInvoices: liveInvoices, isLiveApi: true, isLoading: false });
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(liveInvoices));
          } catch {}
          return;
        }
      }
    } catch (e) {
      // Backend offline fallback
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ settledInvoices: JSON.parse(stored), isLiveApi: false, isLoading: false });
        return;
      }
    } catch {}

    set({ isLoading: false });
  },

  settleInvoice: async (data) => {
    playOrderReadyFeedback();

    const newInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      tableId: data.tableId,
      tableNo: data.tableNo,
      serverName: data.serverName,
      cashierName: data.cashierName,
      items: data.items,
      subtotal: data.subtotal,
      discount: data.discount,
      gstAmount: data.gstAmount,
      total: data.total,
      paymentMode: data.paymentMode,
      amountTendered: data.amountTendered,
      changeReturned: data.changeReturned,
      settledAt: Date.now(),
    };

    const updated = [newInvoice, ...get().settledInvoices];
    set({ settledInvoices: updated });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Settle table on real backend if active session exists
    const table = useFloorStore.getState().tables.find((t) => t.id === data.tableId);
    if (table?.sessionId) {
      try {
        await apiClient.post(`/orders/sessions/${table.sessionId}/pay`, {
          paymentMode: data.paymentMode,
          amount: data.total,
        });
      } catch (e) {
        console.warn('Failed to sync session payment to API:', e);
      }
    }

    // Free the table in Floor Store
    await useFloorStore.getState().settleAndClearTable(data.tableId);

    return newInvoice;
  },
}));
