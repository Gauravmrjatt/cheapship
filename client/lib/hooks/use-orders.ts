"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { useAuth } from "./use-auth";

export interface OrderFilters {
  order_type?: string;
  shipment_status?: string;
  payment_mode?: string;
  shipment_type?: string;
  from?: string;
  to?: string;
  search?: string;
}

export const useOrders = (page: number, pageSize: number, filters: OrderFilters = {}) => {
  const { get } = useHttp();

  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (filters.order_type && filters.order_type !== "ALL") {
    params.append("order_type", filters.order_type);
  }
  if (filters.shipment_status && filters.shipment_status !== "ALL") {
    params.append("shipment_status", filters.shipment_status);
  }
  if (filters.payment_mode && filters.payment_mode !== "ALL") {
    params.append("payment_mode", filters.payment_mode);
  }
  if (filters.shipment_type && filters.shipment_type !== "ALL") {
    params.append("shipment_type", filters.shipment_type);
  }
  if (filters.from) {
    params.append("from", filters.from);
  }
  if (filters.to) {
    params.append("to", filters.to);
  }
  if (filters.search) {
    params.append("search", filters.search);
  }

  return useQuery(get(["orders", page, pageSize, filters], `/orders?${params.toString()}`));
};

export const useCancelOrder = () => {
  const { put } = useHttp();
  const mutation = useMutation(put("/orders"));
  
  return (orderId: string) => mutation.mutateAsync(`${orderId}/cancel`);
};

export const useCheckPhoneVerification = (phone: string, enabled: boolean = false) => {
  const { get } = useHttp();
  
  return useQuery(
    get(["phone-verification", phone], `/addresses/check-verification?phone=${phone}`, enabled && !!phone)
  );
};

export const useCheckPhoneVerificationMutation = () => {
  const { token } = useAuth();
  
  return useMutation<any, Error, string>({
    mutationFn: async (phone: string) => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1" || "http://localhost:3000";
      const response = await fetch(`${API_BASE_URL}/addresses/check-verification?phone=${phone}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check phone verification");
      }
      return response.json();
    },
  });
};

export const useSendVerificationOtp = () => {
  const { post } = useHttp();
  
  return useMutation(post("/addresses/verify-phone"));
};

export const useVerifyPhoneOtp = () => {
  const { post } = useHttp();
  
  return useMutation(post("/addresses/verify-otp"));
};