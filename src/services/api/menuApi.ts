import { apiClient } from './client';

export interface ApiMenuItem {
  _id: string;
  name: string;
  categoryId?: { _id: string; name: string } | string;
  categoryName?: string;
  price: number;
  isAvailable: boolean;
  isVegetarian?: boolean;
  description?: string;
  image?: string;
}

export const fetchMenuItemsApi = async (): Promise<ApiMenuItem[]> => {
  const response = await apiClient.get('/menu/items');
  if (response.data?.success) {
    return response.data.data;
  }
  return [];
};

export const updateItemAvailabilityApi = async (itemId: string, isAvailable: boolean) => {
  const response = await apiClient.put(`/menu/items/${itemId}`, { isAvailable });
  return response.data;
};
