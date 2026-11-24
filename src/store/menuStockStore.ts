import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playTouchFeedback } from '../services/audio/soundService';

export interface StockItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean; // false = 86'd (Sold Out)
  isVegetarian: boolean;
}

const STOCK_STORAGE_KEY = 'tablly_mobile_stock_v1';

const INITIAL_MENU_ITEMS: StockItem[] = [
  { id: 'm1', name: 'Paneer Butter Masala', category: 'Main Course', price: 320, isAvailable: true, isVegetarian: true },
  { id: 'm2', name: 'Dal Makhani Slow Cooked', category: 'Main Course', price: 260, isAvailable: true, isVegetarian: true },
  { id: 'm3', name: 'Tandoori Chicken Full', category: 'Starters', price: 480, isAvailable: true, isVegetarian: false },
  { id: 'm4', name: 'Butter Garlic Naan', category: 'Breads', price: 80, isAvailable: true, isVegetarian: true },
  { id: 'm5', name: 'Mutton Rogan Josh', category: 'Main Course', price: 540, isAvailable: false, isVegetarian: false },
  { id: 'm6', name: 'Sweet Mango Lassi', category: 'Beverages', price: 120, isAvailable: true, isVegetarian: true },
  { id: 'm7', name: 'Gulab Jamun with Rabri', category: 'Desserts', price: 160, isAvailable: true, isVegetarian: true },
  { id: 'm8', name: 'Crispy Veg Spring Rolls', category: 'Starters', price: 220, isAvailable: true, isVegetarian: true },
];

interface MenuStockState {
  items: StockItem[];
  searchQuery: string;
  selectedCategory: string;

  loadStock: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  toggleAvailability: (itemId: string) => Promise<void>;
}

export const useMenuStockStore = create<MenuStockState>((set, get) => ({
  items: INITIAL_MENU_ITEMS,
  searchQuery: '',
  selectedCategory: 'all',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  loadStock: async () => {
    try {
      const stored = await AsyncStorage.getItem(STOCK_STORAGE_KEY);
      if (stored) {
        set({ items: JSON.parse(stored) });
      }
    } catch (e) {
      console.warn('Failed to load menu stock:', e);
    }
  },

  toggleAvailability: async (itemId: string) => {
    playTouchFeedback();
    const updated = get().items.map((item) =>
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    );
    set({ items: updated });
    try {
      await AsyncStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },
}));
