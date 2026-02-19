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
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  recentOrders: RecentOrder[];
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
}

export interface AdminOrder {
  id: string;
  order_type: string;
  shipment_type: string;
  payment_mode: string;
  total_amount: number;
  shipment_status: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
  courier_name?: string;
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
  status: string;
  created_at: string;
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

export const useToggleUserStatus = () => {
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
      sileo.success({ title: "User status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });
};

export const useAdminOrders = (page: number = 1, pageSize: number = 10, status: string = "ALL", search: string = "", userId: string = "") => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    status,
    search,
    userId
  });
  return useQuery(http.get<AdminOrdersResponse>(["admin-orders", page, pageSize, status, search, userId], `/admin/orders?${queryParams.toString()}`));
};

export const useAdminTransactions = (page: number = 1, pageSize: number = 10, type: string = "ALL", search: string = "", userId: string = "") => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    type,
    search,
    userId
  });
  return useQuery(http.get<AdminTransactionsResponse>(["admin-transactions", page, pageSize, type, search, userId], `/admin/transactions?${queryParams.toString()}`));
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

export const useSetUserCommissionBounds = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<UserCommissionBounds, { min_rate: number; max_rate: number }>("/admin/users/commission-bounds", {
      onSuccess: (_, variables) => {
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
