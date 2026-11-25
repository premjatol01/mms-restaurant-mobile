import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playTouchFeedback } from '../services/audio/soundService';
import { apiClient } from '../services/api/client';

export interface StockItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean; // false = 86'd (Sold Out)
  isVegetarian: boolean;
}

const STOCK_STORAGE_KEY = 'tablly_mobile_stock_v1';

export const INITIAL_MENU_ITEMS: StockItem[] = [];

interface MenuStockState {
  items: StockItem[];
  searchQuery: string;
  selectedCategory: string;
  isLoading: boolean;
  isLiveApi: boolean;

  loadStock: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  toggleAvailability: (itemId: string) => Promise<void>;
}

export const useMenuStockStore = create<MenuStockState>((set, get) => ({
  items: INITIAL_MENU_ITEMS,
  searchQuery: '',
  selectedCategory: 'all',
  isLoading: false,
  isLiveApi: false,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  loadStock: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/menu/items');
      if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const liveItems: StockItem[] = response.data.data.map((item: any) => ({
          id: item._id,
          name: item.name,
          category: item.categoryId?.name || item.category || 'Dishes',
          price: item.price || 0,
          isAvailable: item.isAvailable !== false,
          isVegetarian: item.isVegetarian ?? true,
        }));

        set({ items: liveItems, isLiveApi: true, isLoading: false });
        try {
          await AsyncStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(liveItems));
        } catch {}
        return;
      }
    } catch (e) {
      // Backend offline fallback
    }

    try {
      const stored = await AsyncStorage.getItem(STOCK_STORAGE_KEY);
      if (stored) {
        set({ items: JSON.parse(stored), isLiveApi: false, isLoading: false });
        return;
      }
    } catch {}

    set({ isLoading: false });
  },

  toggleAvailability: async (itemId: string) => {
    playTouchFeedback();
    const currentItem = get().items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const nextStatus = !currentItem.isAvailable;
    const updated = get().items.map((item) =>
      item.id === itemId ? { ...item, isAvailable: nextStatus } : item
    );
    set({ items: updated });

    // Sync status with backend
    try {
      await apiClient.put(`/menu/items/${itemId}`, { isAvailable: nextStatus });
    } catch (e) {
      console.warn('Failed to sync menu item availability to API:', e);
    }

    try {
      await AsyncStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },
}));
