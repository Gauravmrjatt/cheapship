"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { sileo } from "sileo";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface RecentOrder {
  id: string;
  user: { name: string };
  shipment_status: string;
  total_amount: number;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
    wallet_balance?: number;
  };
}

export interface AdminWithdrawalResponse {
  data: Withdrawal[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface DashboardStats {
  // Basic stats
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  recentOrders: RecentOrder[];
  totalUserBalance: number;

  // Order status counts
  deliveredOrders: number;
  inTransitOrders: number;
  dispatchedOrders: number;
  manifestedOrders: number;
  rtoOrders: number;
  pendingOrders: number;
  notPickedOrders: number;
  cancelledOrders: number;

  // Metrics
  lastMonthOrders: number;
  totalWeightShipped: string;
  avgDeliveryTime: string;
  deliverySuccessRate: string;
  returnRate: string;
  monthlyGrowth: string;

  // Disputes
  weightDisputeOrders: number;
  rtoDisputeOrders: number;
  actionRequired: number;

  // Graph data
  graphData: {
    date: string;
    DELIVERED: number;
    PENDING: number;
    CANCELLED: number;
    IN_TRANSIT: number;
    DISPATCHED: number;
    MANIFESTED: number;
    RTO: number;
    NOT_PICKED: number;
    TOTAL: number;
  }[];

  // Top data
  topCouriers: { courier_name: string; order_count: number }[];
  topUsers: { name: string; order_count: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  mobile: string;
  is_active: boolean;
  user_type: string;
  wallet_balance: number;
  created_at: string;
  min_commission_rate?: number;
  max_commission_rate?: number;
  assigned_rates?: any;
  upi_id?: string;
  security_deposit?: number;
  _count?: {
    orders: number;
  };
}

export interface AdminOrder {
  id: string;
  order_type: string;
  shipment_type: string;
  payment_mode: string;
  total_amount: number;
  shipping_charge?: number;
  base_shipping_charge?: number;
  shipment_status: string;
  created_at?: string;
  tracking_number?: string;
  shiprocket_shipment_id?: string;
  courier_name?: string;
  label_url?: string;
  track_url?: string;
  manifest_url?: string;
  cod_amount?: number;
  is_draft?: boolean;
  order_pickup_address?: {
    name: string;
    phone?: string;
    address?: string;
    city: string;
    state: string;
    country?: string;
    pincode?: string;
  };
  order_receiver_address?: {
    name: string;
    phone?: string;
    address?: string;
    city: string;
    state: string;
    country?: string;
    pincode?: string;
  };
  user?: {
    name: string;
    email: string;
    mobile?: string;
  };
  pickup_location?: string;
  shiprocket_order_id?: string,

}

export interface AdminOrdersResponse {
  data: AdminOrder[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface AdminTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  category: string;
  status: string;
  status_reason: string | null;
  description: string | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface AdminTransactionsResponse {
  data: AdminTransaction[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface AdminUsersResponse {
  data: AdminUser[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export const useAdminDashboard = () => {
  const http = useHttp();
  return useQuery(http.get<DashboardStats>(["admin-dashboard"], "/admin/dashboard"));
};

export const useAdminUsers = (page: number = 1, pageSize: number = 10, search: string = "", status: string = "ALL") => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search,
    status
  });
  return useQuery(http.get<AdminUsersResponse>(["admin-users", page, pageSize, search, status], `/admin/users?${queryParams.toString()}`));
};

export const useToggleUserStatus = (isMounted?: React.MutableRefObject<boolean>) => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<unknown, { userId: string, is_active: boolean }>("/admin/users/status", {
    }),
    mutationFn: async ({ userId, is_active }: { userId: string, is_active: boolean }) => {
      const response = await fetch(`${BASE_URL}/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`
        },
        body: JSON.stringify({ is_active })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json() as Promise<unknown>;
    },
    onSuccess: () => {
      if (isMounted?.current === false) return;
      sileo.success({ title: "User status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });
};

export const useAdminOrders = (
  page: number = 1,
  pageSize: number = 10,
  status: string = "ALL",
  search: string = "",
  userId: string = "",
  shipmentType: string = "ALL",
  paymentMode: string = "ALL",
  orderType: string = "ALL",
  from: string = "",
  to: string = ""
) => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    status,
    search,
    userId
  });

  if (shipmentType !== "ALL") queryParams.append("shipmentType", shipmentType);
  if (paymentMode !== "ALL") queryParams.append("paymentMode", paymentMode);
  if (orderType !== "ALL") queryParams.append("orderType", orderType);
  if (from) queryParams.append("from", from);
  if (to) queryParams.append("to", to);

  const queryOptions = http.get<AdminOrdersResponse>(["admin-orders", page, pageSize, status, search, userId, shipmentType, paymentMode, orderType, from, to], `/admin/orders?${queryParams.toString()}`);
  return useQuery(queryOptions);
};

export const useAdminOrder = (orderId: string) => {
  const http = useHttp();
  return useQuery(http.get<AdminOrder & { price_breakdown: PriceBreakdown }>(["admin-order", orderId], `/admin/orders/${orderId}`, !!orderId));
};

interface PriceBreakdown {
  base_shipping_charge: number;
  global_commission_rate: number;
  global_commission_amount: number;
  franchise_commission_rate: number;
  franchise_commission_amount: number;
  final_shipping_charge: number;
}

export const useAdminTransactions = (page: number = 1, pageSize: number = 10, type: string = "ALL", search: string = "", userId: string = "", category: string = "ALL", fromDate?: string, toDate?: string) => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    type,
    category,
    search,
    userId
  });
  if (fromDate) queryParams.append("fromDate", fromDate);
  if (toDate) queryParams.append("toDate", toDate);
  return useQuery(http.get<AdminTransactionsResponse>(["admin-transactions", page, pageSize, type, category, search, userId, fromDate, toDate], `/admin/transactions?${queryParams.toString()}`));
};

export const useAdminWithdrawals = (page: number = 1, pageSize: number = 10, status: string = "ALL") => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    status
  });
  return useQuery(http.get<AdminWithdrawalResponse>(["admin-withdrawals", page, pageSize, status], `/admin/withdrawals?${queryParams.toString()}`));
};

export const useProcessWithdrawal = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'APPROVED' | 'REJECTED' }) => {
      const mutator = http.post<unknown, { status: string }>(`/admin/withdrawals/${id}/process`).mutationFn;
      return mutator({ status });
    },
    onSuccess: () => {
      sileo.success({ title: "Withdrawal processed" });
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    }
  });
};

export const useGlobalSettings = () => {
  const http = useHttp();
  return useQuery(http.get<{ rate: number }>(["global-commission"], "/admin/settings/global-commission"));
};

export const useUpdateGlobalSettings = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<any, { rate: number }>("/admin/settings/global-commission", {
      onSuccess: () => {
        sileo.success({ title: "Global commission updated" });
        queryClient.invalidateQueries({ queryKey: ["global-commission"] });
      }
    })
  });
};

// Global Commission Limits (min/max rates for new users)
export interface CommissionLimits {
  min_rate: number;
  max_rate: number;
}

export const useCommissionLimits = () => {
  const http = useHttp();
  return useQuery(http.get<CommissionLimits>(["commission-limits"], "/admin/settings/commission-limits"));
};

export const useUpdateCommissionLimits = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<CommissionLimits, { min_rate: number; max_rate: number }>("/admin/settings/commission-limits", {
      onSuccess: () => {
        sileo.success({ title: "Commission limits updated" });
        queryClient.invalidateQueries({ queryKey: ["commission-limits"] });
      }
    })
  });
};

// User Commission Bounds (Admin)
export interface UserCommissionBounds {
  user_id: string;
  name: string;
  email: string;
  bounds: {
    min_rate: number;
    max_rate: number;
  };
}

export const useUserCommissionBounds = (userId: string) => {
  const http = useHttp();
  return useQuery(http.get<UserCommissionBounds>(["user-commission-bounds", userId], `/admin/users/${userId}/commission-bounds`));
};

export const useSetUserCommissionBounds = (isMounted?: React.MutableRefObject<boolean>) => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<UserCommissionBounds, { min_rate: number; max_rate: number }>("/admin/users/commission-bounds", {
      onSuccess: () => {
        if (isMounted?.current === false) return;
        sileo.success({ title: "User commission bounds updated" });
        queryClient.invalidateQueries({ queryKey: ["user-commission-bounds"] });
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      }
    }),
    mutationFn: async ({ userId, min_rate, max_rate }: { userId: string; min_rate: number; max_rate: number }) => {
      const mutator = http.post<UserCommissionBounds, { min_rate: number; max_rate: number }>(`/admin/users/${userId}/commission-bounds`).mutationFn;
      return mutator({ min_rate, max_rate });
    }
  });
};

export const useSetUserCustomRates = (isMounted?: React.MutableRefObject<boolean>) => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    mutationFn: async ({ userId, assigned_rates }: { userId: string; assigned_rates: any }) => {
      const mutator = http.post<any, { assigned_rates: any }>(`/admin/users/${userId}/custom-rates`).mutationFn;
      return mutator({ assigned_rates });
    },
    onSuccess: () => {
      if (isMounted?.current === false) return;
      sileo.success({ title: "Custom rates updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      sileo.error({ title: "Failed to update custom rates", description: err.message });
    }
  });
};

// Referral Level Setting (max levels only)
export interface ReferralLevelSetting {
  max_levels: number;
  is_active: boolean;
}

export const useReferralLevelSetting = () => {
  const http = useHttp();
  return useQuery(http.get<ReferralLevelSetting>(["referral-levels"], "/admin/settings/referral-levels"));
};

export const useUpdateReferralLevelSetting = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<ReferralLevelSetting, { max_levels: number }>("/admin/settings/referral-levels", {
      onSuccess: () => {
        sileo.success({ title: "Referral levels updated" });
        queryClient.invalidateQueries({ queryKey: ["referral-levels"] });
      }
    })
  });
};

// Network Commission Stats
export interface NetworkCommissionStats {
  total_commission: number;
  total_count: number;
  pending_commission: number;
  pending_count: number;
  withdrawn_commission: number;
  withdrawn_count: number;
}

export const useNetworkCommissionStats = () => {
  const http = useHttp();
  return useQuery(http.get<NetworkCommissionStats>(["network-commission-stats"], "/admin/network-commission-stats"));
};

export interface AdminKycUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  kyc_status: string;
  pan_number: string | null;
  pan_verified: boolean;
  aadhaar_number: string | null;
  aadhaar_verified: boolean;
  gst_number: string | null;
  gst_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminKycResponse {
  data: AdminKycUser[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export const useAdminKyc = (page: number = 1, pageSize: number = 10, status: string = "ALL", search: string = "") => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    status,
    search
  });
  return useQuery<AdminKycResponse>(http.get<AdminKycResponse>(["admin-kyc", page, pageSize, status, search], `/admin/kyc?${queryParams.toString()}`));
};

export const useUpdateKycStatus = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    mutationFn: async ({ userId, kyc_status, pan_verified, aadhaar_verified, gst_verified }: {
      userId: string;
      kyc_status: string;
      pan_verified?: boolean;
      aadhaar_verified?: boolean;
      gst_verified?: boolean;
    }) => {
      const response = await fetch(`${BASE_URL}/api/v1/admin/kyc/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`
        },
        body: JSON.stringify({ kyc_status, pan_verified, aadhaar_verified, gst_verified })
      });
      if (!response.ok) throw new Error('Failed to update KYC status');
      return response.json() as Promise<{ message: string; user: AdminKycUser }>;
    },
    onSuccess: () => {
      sileo.success({ title: "KYC status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-kyc"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });
};

export const useAdminCancelOrder = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`${BASE_URL}/api/v1/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to cancel order');
      return response.json();
    },
    onSuccess: () => {
      sileo.success({ title: "Order cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: any) => {
      sileo.error({ title: err.message || "Failed to cancel order" });
    }
  });
};

export const useAdminGenerateLabel = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`${BASE_URL}/api/v1/admin/orders/${orderId}/label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to generate label');
      return response.json();
    },
    onSuccess: () => {
      sileo.success({ title: "Label generated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: any) => {
      sileo.error({ title: err.message || "Failed to generate label" });
    }
  });
};

export interface WalletPlan {
  id: string;
  name: string;
  recharge_amount: number;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletPlansResponse {
  data: WalletPlan[];
}

export const useWalletPlans = (status: string = "ALL") => {
  const http = useHttp();
  return useQuery<WalletPlansResponse>(http.get<WalletPlansResponse>(["wallet-plans", status], `/admin/wallet-plans?status=${status}`));
};

export const useActiveWalletPlans = () => {
  const http = useHttp();
  return useQuery<WalletPlansResponse>(http.get<WalletPlansResponse>(["active-wallet-plans"], "/admin/wallet-plans/active"));
};

export const useCreateWalletPlan = (isMounted?: React.MutableRefObject<boolean>) => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    mutationFn: async ({ name, recharge_amount, discount_percentage }: { name: string; recharge_amount: number; discount_percentage: number }) => {
      const mutator = http.post<{ message: string; plan: WalletPlan }, { name: string; recharge_amount: number; discount_percentage: number }>("/admin/wallet-plans").mutationFn;
      return mutator({ name, recharge_amount, discount_percentage });
    },
    onSuccess: () => {
      if (isMounted?.current === false) return;
      sileo.success({ title: "Wallet plan created successfully" });
      queryClient.invalidateQueries({ queryKey: ["wallet-plans"] });
      queryClient.invalidateQueries({ queryKey: ["active-wallet-plans"] });
    },
    onError: (err: any) => {
      sileo.error({ title: "Failed to create wallet plan", description: err.message });
    }
  });
};

export const useUpdateWalletPlan = (isMounted?: React.MutableRefObject<boolean>) => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    mutationFn: async ({ id, name, recharge_amount, discount_percentage, is_active }: { id: string; name?: string; recharge_amount?: number; discount_percentage?: number; is_active?: boolean }) => {
      const mutator = http.put<{ message: string; plan: WalletPlan }, { name?: string; recharge_amount?: number; discount_percentage?: number; is_active?: boolean }>(`/admin/wallet-plans/${id}`).mutationFn;
      return mutator({ name, recharge_amount, discount_percentage, is_active });
    },
    onSuccess: () => {
      if (isMounted?.current === false) return;
      sileo.success({ title: "Wallet plan updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["wallet-plans"] });
      queryClient.invalidateQueries({ queryKey: ["active-wallet-plans"] });
    },
    onError: (err: any) => {
      sileo.error({ title: "Failed to update wallet plan", description: err.message });
    }
  });
};

export const useDeleteWalletPlan = (isMounted?: React.MutableRefObject<boolean>) => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    mutationFn: async ({ id, permanent = false }: { id: string; permanent?: boolean }) => {
      const token = localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : '';
      const url = permanent 
        ? `${BASE_URL}/api/v1/admin/wallet-plans/${id}?permanent=true`
        : `${BASE_URL}/api/v1/admin/wallet-plans/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete wallet plan');
      return response.json();
    },
    onSuccess: (_, variables) => {
      if (isMounted?.current === false) return;
      sileo.success({ title: variables.permanent ? "Wallet plan deleted permanently" : "Wallet plan deactivated" });
      queryClient.invalidateQueries({ queryKey: ["wallet-plans"] });
      queryClient.invalidateQueries({ queryKey: ["active-wallet-plans"] });
    },
    onError: (err: any) => {
      sileo.error({ title: "Failed to delete wallet plan", description: err.message });
    }
  });
};

// Security Refund Schedule
export interface SecurityRefundSchedule {
  id: string;
  scheduled_date: string;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useSecurityRefundSchedule = () => {
  const http = useHttp();
  return useQuery(http.get<SecurityRefundSchedule>(["security-refund"], "/admin/settings/security-refund"));
};

export const useSetSecurityRefundSchedule = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<SecurityRefundSchedule, { scheduled_date: string; is_active: boolean }>("/admin/settings/security-refund", {
      onSuccess: () => {
        sileo.success({ title: "Security refund schedule saved" });
        queryClient.invalidateQueries({ queryKey: ["security-refund"] });
      },
      onError: (err: any) => {
        sileo.error({ title: "Failed to save schedule", description: err.message });
      }
    })
  });
};

// Security Refund Days Setting
export const useSecurityRefundDays = () => {
  const http = useHttp();
  return useQuery(http.get<{ days: number }>(["security-refund-days"], "/admin/settings/security-refund-days"));
};

export const useUpdateSecurityRefundDays = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<{ days: number }, { days: number }>("/admin/settings/security-refund-days", {
      onSuccess: () => {
        sileo.success({ title: "Security refund days updated" });
        queryClient.invalidateQueries({ queryKey: ["security-refund-days"] });
      },
      onError: (err: any) => {
        sileo.error({ title: "Failed to update days", description: err.message });
      }
    })
  });
};

// Admin Security Deposits
export interface AdminSecurityDeposit {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  used_amount: number;
  remaining: number;
  status: string;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    shipment_status: string;
    total_amount: number;
    shipping_charge: number;
  };
  user?: {
    name: string;
    email: string;
    mobile: string;
  };
}

export interface AdminSecurityDepositsResponse {
  data: AdminSecurityDeposit[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export const useAdminSecurityDeposits = (page: number = 1, pageSize: number = 20, status: string = "") => {
  const http = useHttp();
  return useQuery(http.get<AdminSecurityDepositsResponse>(
    ["admin-security-deposits", page, pageSize, status],
    `/admin/settings/security-deposits?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ""}`
  ));
};

export const useAdminSecurityDepositByOrder = (orderId: string) => {
  const http = useHttp();
  return useQuery(http.get<AdminSecurityDeposit>(
    ["admin-security-deposit-by-order", orderId],
    `/admin/settings/security-deposits/${orderId}`
  ));
};
