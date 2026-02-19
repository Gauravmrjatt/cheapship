"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { sileo } from "sileo";
import { useAuthStore } from "@/lib/store/auth";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"; 
export interface Franchise {
  id: string;
  name: string;
  email: string;
  mobile: string;
  referer_code: string;
  commission_rate: number | null;
  assigned_rates: Record<string, { rate: number; slab: number }> | null;
  franchise_type: string | null;
  franchise_address: string | null;
  franchise_pincode: string | null;
  franchise_city: string | null;
  franchise_state: string | null;
  is_active: boolean;
  created_at: string;
  total_profit: number;
  withdrawable_profit: number;
  pending_profit: number;
  total_base_shipping_charge: number;
  total_withdrawn: number;
  balance: number;
  _count?: {
    orders: number;
  };
}

export interface CommissionLimits {
  min_rate: number;
  max_rate: number;
}

export interface FranchiseResponse {
  franchises: Franchise[];
  bounds: CommissionLimits;
}

export interface FranchiseOrder {
  id: string | number;
  user_id: string;
  order_type: string;
  shipment_status: string;
  shipment_type: string;
  payment_mode: string;
  total_amount: number;
  weight: number | null;
  courier_id: number | null;
  courier_name: string | null;
  shipping_charge: number | null;
  base_shipping_charge: number | null;
  franchise_commission_rate: number | null;
  franchise_commission_amount: number | null;
  delivered_at: string | null;
  created_at: string;
  order_pickup_address: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  order_receiver_address: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
}

// Get all franchises for the current user
export const useFranchisesList = () => {
  const http = useHttp();
  return useQuery(http.get<FranchiseResponse>(["franchises"], "/franchise/list"));
};

// Get current user's referral code
export const useMyReferralCode = () => {
  const http = useHttp();
  return useQuery(http.get<{
    id: string;
    name: string;
    email: string;
    referer_code: string;
    referral_link: string;
  }>(["my-referral-code"], "/franchise/me"));
};

interface UpdateFranchiseRateParams {
  franchiseId: string;
  commission_rate?: number;
  assigned_rates?: Record<string, { rate: number; slab: number }>;
}

interface UpdateFranchiseData {
  commission_rate?: number;
  assigned_rates?: Record<string, { rate: number; slab: number }>;
}

// Update franchise commission rate
export const useUpdateFranchiseRate = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    ...http.put<unknown, UpdateFranchiseData>("/franchise", {
      onSuccess: () => {
        sileo.success({ title: "Franchise settings updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["franchises"] });
      },
    }),
    mutationFn: async ({ franchiseId, ...data }: UpdateFranchiseRateParams) => {
      const mutator = http.put<unknown, UpdateFranchiseData>(`/franchise/${franchiseId}`).mutationFn;
      return mutator(data);
    }
  });
};

// Get orders for a specific franchise
export const useFranchiseOrders = (franchiseId: string, page: number = 1, pageSize: number = 10, status: string = "ALL") => {
  const http = useHttp();
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (status !== "ALL") {
    queryParams.append("shipment_status", status);
  }

  return useQuery({
    ...http.get<{
      data: FranchiseOrder[];
      pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
      }
    }>(["franchise-orders", franchiseId, page, pageSize, status], `/franchise/${franchiseId}/orders?${queryParams.toString()}`),
    enabled: !!franchiseId,
  });
};

// Verify referral code (public)
export const useVerifyReferralCode = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`${BASE_URL}/api/v1/franchise/verify?code=${code}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify referral code");
      }
      return response.json();
    },
  });
};

// Withdraw commission
interface WithdrawResponse {
  message?: string;
}

export const useWithdrawCommission = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    ...http.post<WithdrawResponse, { franchiseId: string; amount: number }>("/franchise", {
      onSuccess: (data) => {
        sileo.success({ title: "Success" , description : data.message || "Withdrawal request submitted successfully" });
        queryClient.invalidateQueries({ queryKey: ["franchises"] });
      },
    }),
    mutationFn: async ({ franchiseId, amount }: { franchiseId: string; amount: number }) => {
      const mutator = http.post<unknown, { amount: number }>(`/franchise/${franchiseId}/withdraw`).mutationFn;
      return mutator({ amount });
    }
  });
};

// Multi-Level Referral Commissions
export interface ReferralCommission {
  id: string;
  order_id: number;
  level: number;
  amount: number;
  is_withdrawn: boolean;
  withdrawn_at?: string;
  created_at: string;
  order: {
    id: number;
    shipment_status: string;
    created_at: string;
    customer_name?: string;
  };
}

export interface ReferralCommissionSummary {
  total_commissions: number;
  total_amount: number;
  pending_amount: number;
  withdrawn_amount: number;
  pending_count: number;
  withdrawn_count: number;
}

export interface ReferralCommissionResponse {
  commissions: ReferralCommission[];
  summary: ReferralCommissionSummary;
}

export const useMyReferralCommissions = (status: 'all' | 'pending' | 'withdrawn' = 'all') => {
  const http = useHttp();
  return useQuery(http.get<ReferralCommissionResponse>(["my-referral-commissions", status], `/franchise/my-referral-commissions?status=${status}`));
};

export const useWithdrawReferralCommissions = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    ...http.post<WithdrawResponse, void>("/franchise/withdraw-referral-commissions", {
      onSuccess: (data) => {
        sileo.success({ title: "Success", description: data.message || "Withdrawal request submitted successfully" });
        queryClient.invalidateQueries({ queryKey: ["my-referral-commissions"] });
        queryClient.invalidateQueries({ queryKey: ["referral-network-stats"] });
      },
    })
  });
};

export interface ReferralNetworkStats {
  total_commissions: number;
  total_amount: number;
  pending_withdrawable: number;
  withdrawn_amount: number;
  level_breakdown: {
    level: number;
    total_amount: number;
    count: number;
  }[];
}

export const useReferralNetworkStats = () => {
  const http = useHttp();
  return useQuery(http.get<ReferralNetworkStats>(["referral-network-stats"], "/franchise/referral-network-stats"));
};
