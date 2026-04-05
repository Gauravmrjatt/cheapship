"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./use-http";

export interface FeedbackFilters {
  type?: string;
  search?: string;
}

export const useAdminFeedback = (page: number, pageSize: number, filters: FeedbackFilters = {}) => {
  const { get } = useHttp();

  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (filters.type && filters.type !== "ALL") {
    params.append("type", filters.type);
  }
  if (filters.search) {
    params.append("search", filters.search);
  }

  const queryOptions = get(["admin-feedback", page, pageSize, filters], `/feedback?${params.toString()}`);
  return useQuery(queryOptions);
};
