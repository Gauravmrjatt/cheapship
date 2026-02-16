"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { sileo } from "sileo";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"; 
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  recentOrders: any[];
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
  return useQuery(http.get<any>(["admin-users", page, pageSize, search, status], `/admin/users?${queryParams.toString()}`));
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<any, { userId: string, is_active: boolean }>("/admin/users/status", {
        // Note: The route in admin.route.js is PATCH /users/:userId/status, but useHttp might need tweaking for patch or just use put/post
        // Let's use custom fetch in mutationFn to match the route exactly if useHttp doesn't support patch easily
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
       return response.json();
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
  return useQuery(http.get<any>(["admin-orders", page, pageSize, status, search, userId], `/admin/orders?${queryParams.toString()}`));
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
  return useQuery(http.get<any>(["admin-transactions", page, pageSize, type, search, userId], `/admin/transactions?${queryParams.toString()}`));
};

export const useAdminWithdrawals = (page: number = 1, pageSize: number = 10, status: string = "ALL") => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    status
  });
  return useQuery(http.get<any>(["admin-withdrawals", page, pageSize, status], `/admin/withdrawals?${queryParams.toString()}`));
};

export const useProcessWithdrawal = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'APPROVED' | 'REJECTED' }) => {
       // useHttp.post wraps body, need to construct URL correctly
       const mutator = http.post<any, any>(`/admin/withdrawals/${id}/process`).mutationFn;
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
