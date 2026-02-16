"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { toast } from "sonner";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description: string | null;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useTransactions = (page: number = 1, pageSize: number = 10, type?: string, status?: string, search?: string) => {
  const http = useHttp();
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (type) queryParams.append("type", type);
  if (status) queryParams.append("status", status);
  if (search) queryParams.append("search", search);

  return useQuery(http.get<{
    data: Transaction[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  }>(["transactions", page, pageSize, type, status, search], `/transactions?${queryParams.toString()}`));
};

export const useTopUpWallet = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    ...http.post<any, { amount: number; reference_id?: string }>("/transactions/topup", {
      onSuccess: () => {
        toast.success("Wallet topped up successfully");
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      },
    })
  });
};
