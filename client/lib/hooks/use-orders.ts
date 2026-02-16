"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"; 

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
  const { token } = useAuth();

  return useQuery({
    queryKey: ["orders", page, pageSize, filters],
    queryFn: async () => {
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

      const response = await fetch(
        `${BASE_URL}/api/v1/orders?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
    enabled: !!token,
  });
};

export const useCancelOrder = () => {
  const { token } = useAuth();

  return async (orderId: string) => {
    const response = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/cancel`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to cancel order");
    }

    return response.json();
  };
};