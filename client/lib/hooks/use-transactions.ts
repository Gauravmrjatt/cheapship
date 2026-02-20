"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { sileo } from "sileo";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: 'WALLET_TOPUP' | 'ORDER_PAYMENT' | 'REFUND' | 'COD_REMITTANCE' | 'COMMISSION';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  status_reason: string | null;
  description: string | null;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export const useTransactions = (
  page: number = 1, 
  pageSize: number = 10, 
  type?: string, 
  category?: string,
  status?: string, 
  search?: string,
  fromDate?: string,
  toDate?: string
) => {
  const http = useHttp();
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (type) queryParams.append("type", type);
  if (category) queryParams.append("category", category);
  if (status) queryParams.append("status", status);
  if (search) queryParams.append("search", search);
  if (fromDate) queryParams.append("fromDate", fromDate);
  if (toDate) queryParams.append("toDate", toDate);

  return useQuery(http.get<{
    data: Transaction[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  }>(["transactions", page, pageSize, type, category, status, search, fromDate, toDate], `/transactions?${queryParams.toString()}`));
};

export const useTopUpWallet = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    ...http.post<unknown, { amount: number; reference_id?: string }>("/transactions/topup", {
      onSuccess: () => {
        sileo.success({ title: "Wallet topped up successfully" });
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      },
    })
  });
};

export const useCreateRazorpayOrder = () => {
  const http = useHttp();
  return useMutation({
    ...http.post<{ id: string; amount: number; currency: string }, { amount: number }>("/transactions/razorpay/order")
  });
};

export const useVerifyRazorpayPayment = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    ...http.post<unknown, { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; amount: number }>("/transactions/razorpay/verify", {
      onSuccess: () => {
        sileo.success({ title: "Payment successful", description: "Wallet balance updated." });
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      },
      onError: () => {
        sileo.error({ title: "Payment verification failed", description: "Please contact support if amount was deducted." });
      }
    })
  });
};
