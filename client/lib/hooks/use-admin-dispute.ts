"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { sileo } from "sileo";

export interface AdminWeightDispute {
  id: string;
  order_id: string;
  user_id: string;
  applied_weight: number;
  charged_weight: number;
  applied_amount: number;
  charged_amount: number;
  difference_amount: number;
  product_category: string | null;
  discrepancy_description: string | null;
  weight_scale_image: string | null;
  packed_box_image: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  action_reason: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    tracking_number: string;
    courier_name: string;
    weight: number | null;
    shipping_charge: number | null;
    shipment_status: string;
    length: number | null;
    width: number | null;
    height: number | null;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    wallet_balance: number;
    security_deposit: number;
  };
}

export interface AdminOrderForDispute {
  id: string;
  tracking_number: string | null;
  weight: number | null;
  shipping_charge: number | null;
  base_shipping_charge: number | null;
  shipment_status: string;
  courier_name: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    wallet_balance: number;
    security_deposit: number;
  };
  weight_dispute: {
    id: string;
    status: string;
    difference_amount: number;
  } | null;
}

export interface CreateWeightDisputePayload {
  order_id: string;
  weight_type: 'LESS' | 'MORE';
  applied_weight: number;
  charged_weight: number;
  amount: number;
  action_reason: string;
  discrepancy_description?: string;
}

export interface WeightDisputeResponse {
  message: string;
  data: {
    dispute: AdminWeightDispute;
    walletChanges: {
      previousWalletBalance: number;
      newWalletBalance: number;
      previousSecurityDeposit: number;
      newSecurityDeposit: number;
      securityDeducted: number;
      walletDeducted: number;
      walletAdded: number;
    };
  };
}

export const useAdminWeightDisputes = (page: number = 1, pageSize: number = 10, status?: string, search?: string) => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (status && status !== 'ALL') queryParams.append("status", status);
  if (search) queryParams.append("search", search);

  return useQuery(http.get<{
    data: AdminWeightDispute[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  }>(["admin-weight-disputes", page, pageSize, status, search], `/disputes/weight/admin/all?${queryParams.toString()}`));
};

export const useSearchOrdersForDispute = (search: string) => {
  const http = useHttp();
  return useQuery(
    http.get<{ data: AdminOrderForDispute[] }>(
      ["search-orders-dispute", search],
      `/disputes/weight/admin/orders?search=${encodeURIComponent(search)}`,
      search.length >= 2
    )
  );
};

export const useCreateAdminWeightDispute = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    mutationFn: async (payload: CreateWeightDisputePayload) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/disputes/weight/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create weight dispute');
      }
      
      return response.json() as Promise<WeightDisputeResponse>;
    },
    onSuccess: (data) => {
      sileo.success({ title: "Weight Dispute Created", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["admin-weight-disputes"] });
    },
    onError: (error: Error) => {
      sileo.error({ title: "Failed to create weight dispute", description: error.message });
    }
  });
};

// RTO Types
export interface AdminRTODispute {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  action_reason: string | null;
  rto_awb: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    tracking_number: string;
    courier_name: string;
    shipment_status: string;
    rto_charges: number | null;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    wallet_balance: number;
    security_deposit: number;
  };
}

export interface AdminOrderForRTO {
  id: string;
  tracking_number: string | null;
  shipment_status: string;
  courier_name: string | null;
  rto_charges: number | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    wallet_balance: number;
    security_deposit: number;
  };
  rto_dispute: {
    id: string;
    status: string;
  } | null;
}

export interface CreateRTOPayload {
  order_id: string;
  amount: number;
  reason: string;
  rto_awb?: string;
}

export interface RTOResponse {
  message: string;
  data: {
    rtoDispute: AdminRTODispute;
    walletChanges: {
      previousWalletBalance: number;
      newWalletBalance: number;
      previousSecurityDeposit: number;
      newSecurityDeposit: number;
      securityDeducted: number;
      walletDeducted: number;
    };
  };
}

export const useAdminRTODisputes = (page: number = 1, pageSize: number = 10, status?: string, search?: string) => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (status && status !== 'ALL') queryParams.append("status", status);
  if (search) queryParams.append("search", search);

  return useQuery(http.get<{
    data: AdminRTODispute[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  }>(["admin-rto-disputes", page, pageSize, status, search], `/disputes/rto/admin/all?${queryParams.toString()}`));
};

export const useSearchOrdersForRTO = (search: string) => {
  const http = useHttp();
  return useQuery(
    http.get<{ data: AdminOrderForRTO[] }>(
      ["search-orders-rto", search],
      `/disputes/rto/admin/orders?search=${encodeURIComponent(search)}`,
      search.length >= 2
    )
  );
};

export const useCreateAdminRTODispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRTOPayload) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/disputes/rto/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create RTO');
      }
      
      return response.json() as Promise<RTOResponse>;
    },
    onSuccess: (data) => {
      sileo.success({ title: "RTO Created", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["admin-rto-disputes"] });
    },
    onError: (error: Error) => {
      sileo.error({ title: "Failed to create RTO", description: error.message });
    }
  });
};
