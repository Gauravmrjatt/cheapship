"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/auth";

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
  total_withdrawn: number;
  balance: number;
  _count?: {
    orders: number;
  };
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
  return useQuery(http.get<Franchise[]>(["franchises"], "/franchise/list"));
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

// Update franchise commission rate
export const useUpdateFranchiseRate = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    ...http.put<any, UpdateFranchiseRateParams>("/franchise", {
      onSuccess: () => {
        toast.success("Franchise settings updated successfully");
        queryClient.invalidateQueries({ queryKey: ["franchises"] });
      },
    }),
    mutationFn: async ({ franchiseId, ...data }: UpdateFranchiseRateParams) => {
      // Use the internal mutationFn from http.put but with custom URL
      const mutator = http.put<any, any>(`/franchise/${franchiseId}`).mutationFn;
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
      const response = await fetch(`http://localhost:3001/api/v1/franchise/verify?code=${code}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify referral code");
      }
      return response.json();
    },
  });
};

// Withdraw commission
export const useWithdrawCommission = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    ...http.post<any, { franchiseId: string; amount: number }>("/franchise", {
      onSuccess: (data) => {
        toast.success(data.message || "Withdrawal request submitted successfully");
        queryClient.invalidateQueries({ queryKey: ["franchises"] });
      },
    }),
    mutationFn: async ({ franchiseId, amount }: { franchiseId: string; amount: number }) => {
      const mutator = http.post<any, any>(`/franchise/${franchiseId}/withdraw`).mutationFn;
      return mutator({ amount });
    }
  });
};
