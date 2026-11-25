import { apiClient } from './client';

export interface ApiCustomerReview {
  _id: string;
  customerName?: string;
  customerMobile?: string;
  tableName?: string;
  rating: number; // 1 to 5
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  isSelectedForPortfolio?: boolean;
  createdAt: string;
}

export const fetchAdminReviewsApi = async (): Promise<ApiCustomerReview[]> => {
  const response = await apiClient.get('/reviews');
  if (response.data?.success) {
    return response.data.data;
  }
  return [];
};

export const moderateReviewApi = async (reviewId: string, status: 'approved' | 'rejected') => {
  const response = await apiClient.patch(`/reviews/${reviewId}/status`, { status });
  return response.data;
};
