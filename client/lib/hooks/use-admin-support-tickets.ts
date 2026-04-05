"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./use-http";

export interface SupportTicketFilters {
  status?: string;
  search?: string;
}

export const useAdminSupportTickets = (page: number, pageSize: number, filters: SupportTicketFilters = {}) => {
  const { get } = useHttp();

  const params = new URLSearchParams({
    page: page.toString(),
    limit: pageSize.toString(),
  });

  if (filters.status && filters.status !== "ALL") {
    params.append("status", filters.status);
  }
  if (filters.search) {
    params.append("search", filters.search);
  }

  const queryOptions = get(["admin-support-tickets", page, pageSize, filters], `/support/tickets/admin/all?${params.toString()}`);
  return useQuery(queryOptions);
};
