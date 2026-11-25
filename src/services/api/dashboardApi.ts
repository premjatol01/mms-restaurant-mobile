import { apiClient } from './client';

export interface DashboardMetrics {
  todayRevenue: number;
  todayOrders: number;
  todayAvgOrderValue: number;
  yesterdayRevenue: number;
  yesterdayOrders: number;
  activeTables: number;
  totalTables: number;
  occupancyRate: number;
  averageRating: number;
  pendingKOT: number;
  totalDishes: number;
  availableDishes: number;
  totalReviews: number;
}

export interface DashboardApiResponse {
  success: boolean;
  data: {
    kpi: DashboardMetrics;
    topDishes: Array<{
      name: string;
      quantity: number;
      revenue: number;
      price: number;
      category?: string;
    }>;
    recentOrders?: any[];
    paymentModesBreakdown?: Record<string, number>;
  };
}

export const fetchDashboardAnalytics = async (): Promise<DashboardApiResponse['data']> => {
  const response = await apiClient.get<DashboardApiResponse>('/restaurant/analytics');
  if (response.data?.success) {
    return response.data.data;
  }
  throw new Error('Failed to load restaurant analytics');
};
