import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playOrderReadyFeedback, playTouchFeedback } from '../services/audio/soundService';
import { useFloorStore, TableItem } from './floorStore';

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

const INITIAL_SETTLED_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-2026-1048',
    tableId: 'tbl-prev-1',
    tableNo: 'Table 3',
    serverName: 'Pooja V.',
    cashierName: 'Amit Patel',
    subtotal: 1450,
    discount: 100,
    gstAmount: 67.5,
    total: 1417.5,
    paymentMode: 'UPI',
    settledAt: Date.now() - 45 * 60 * 1000,
    items: [
      { id: '1', name: 'Paneer Butter Masala', price: 320, quantity: 2 },
      { id: '2', name: 'Butter Naan', price: 60, quantity: 5 },
      { id: '3', name: 'Cold Coffee', price: 170, quantity: 3 },
    ],
  },
  {
    id: 'inv-2',
    invoiceNo: 'INV-2026-1047',
    tableId: 'tbl-prev-2',
    tableNo: 'Table 8',
    serverName: 'Vikram S.',
    cashierName: 'Amit Patel',
    subtotal: 2400,
    discount: 0,
    gstAmount: 120,
    total: 2520,
    paymentMode: 'Card',
    settledAt: Date.now() - 95 * 60 * 1000,
    items: [
      { id: '4', name: 'Tandoori Chicken Full', price: 480, quantity: 3 },
      { id: '5', name: 'Garlic Roti', price: 50, quantity: 8 },
      { id: '6', name: 'Sweet Lassi', price: 120, quantity: 4 },
    ],
  },
];

interface BillingState {
  settledInvoices: InvoiceRecord[];
  activeTab: 'unpaid' | 'history';
  paymentModeFilter: string;

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

  setActiveTab: (activeTab) => {
    playTouchFeedback();
    set({ activeTab });
  },

  setPaymentModeFilter: (paymentModeFilter) => {
    playTouchFeedback();
    set({ paymentModeFilter });
  },

  loadSettlements: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ settledInvoices: JSON.parse(stored) });
      }
    } catch (e) {
      console.warn('Failed to load settlements:', e);
    }
  },

  settleInvoice: async (data) => {
    await playOrderReadyFeedback();

    const invoiceNo = `INV-2026-${Math.floor(1049 + Math.random() * 50)}`;

    const newInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      ...data,
      settledAt: Date.now(),
    };

    const updated = [newInvoice, ...get().settledInvoices];
    set({ settledInvoices: updated });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Automatically clear table and reset session in floorStore
    const floorStore = useFloorStore.getState();
    await floorStore.settleAndClearTable(data.tableId);

    return newInvoice;
  },
}));
