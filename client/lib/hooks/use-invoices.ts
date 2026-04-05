"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./use-http";

export interface InvoiceFilters {
  shipment_status?: string;
  payment_mode?: string;
  order_type?: string;
  from?: string;
  to?: string;
  search?: string;
}

export const useInvoices = (page: number, pageSize: number, filters: InvoiceFilters = {}) => {
  const { get } = useHttp();

  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    shipment_status: "DELIVERED",
  });

  if (filters.payment_mode && filters.payment_mode !== "ALL") {
    params.append("payment_mode", filters.payment_mode);
  }
  if (filters.order_type && filters.order_type !== "ALL") {
    params.append("order_type", filters.order_type);
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

  const queryOptions = get(["invoices", page, pageSize, filters], `/orders?${params.toString()}`);
  return useQuery(queryOptions);
};
