import { apiClient } from './client';

export interface RestaurantProfileData {
  _id?: string;
  name: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  timing?: {
    openingTime?: string;
    closingTime?: string;
    isOpenToday?: boolean;
  };
  billing?: {
    upiId?: string;
    gstNumber?: string;
  };
  status?: 'active' | 'inactive';
}

export const fetchRestaurantProfileApi = async (): Promise<RestaurantProfileData> => {
  const response = await apiClient.get('/restaurant/profile');
  if (response.data?.success) {
    return response.data.data;
  }
  throw new Error('Failed to load profile');
};

export const updateRestaurantProfileApi = async (
  updates: Partial<RestaurantProfileData>
): Promise<RestaurantProfileData> => {
  const response = await apiClient.put('/restaurant/profile', updates);
  if (response.data?.success) {
    return response.data.data;
  }
  throw new Error(response.data?.message || 'Failed to update profile');
};
