export interface DashboardData {
  deliveredOrders: number;
  inTransitOrders: number;
  dispatchedOrders: number;
  manifestedOrders: number;
  rtoInTransitOrders: number;
  rtoOrders: number;
  totalOrders: number;
  lastMonthOrders: number;
  totalWeightShipped: string;
  avgDeliveryTime: string;
  deliverySuccessRate: string;
  returnRate: string;
  cancelledOrder: number;
  weightDisputedOrders: number;
  monthlyGrowth: string;
  actionRequired: number;
}