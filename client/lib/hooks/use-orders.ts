"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useHttp } from "./use-http";

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