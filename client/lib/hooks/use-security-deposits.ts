"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./use-http";

export interface SecurityDepositFilters {
  status?: string;
  from?: string;
  to?: string;
  search?: string;
}

export const useSecurityDeposits = (page: number, pageSize: number, filters: SecurityDepositFilters = {}) => {
  const { get } = useHttp();

  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (filters.status && filters.status !== "ALL") {
    params.append("status", filters.status);
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

  const queryOptions = get(["security-deposits", page, pageSize, filters], `/users/security-deposits?${params.toString()}`);
  return useQuery(queryOptions);
};
