"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { sileo } from "sileo";

export interface WalletWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  payment_method: string | null;
  reference_id: string | null;
  note: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
    mobile: string;
    upi_id: string | null;
    bank_name: string | null;
    beneficiary_name: string | null;
  };
}

export interface WalletBalance {
  wallet_balance: number;
  is_withdrawable: boolean;
  last_order_date: string | null;
  has_bank_details: boolean;
  upi_id: string | null;
  bank_name: string | null;
  beneficiary_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
}

export const useWalletBalance = () => {
  const http = useHttp();
  return useQuery(http.get<WalletBalance>(["wallet-balance"], "/wallet/balance"));
};

export const useWalletWithdrawals = () => {
  const http = useHttp();
  return useQuery(http.get<WalletWithdrawal[]>(["wallet-withdrawals"], "/wallet/withdrawals"));
};

export const useWalletWithdrawalById = (id: string) => {
  const http = useHttp();
  return useQuery(
    http.get<WalletWithdrawal>(["wallet-withdrawal", id], `/wallet/withdrawals/${id}`, !!id)
  );
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<{ message: string; withdrawal: WalletWithdrawal }, { amount: number; note?: string }>(
      "/wallet/withdraw",
      {
        onSuccess: () => {
          sileo.success({ title: "Withdrawal Request Submitted" });
          queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
          queryClient.invalidateQueries({ queryKey: ["wallet-withdrawals"] });
        },
      }
    ),
  });
};

export interface AdminWalletWithdrawal extends WalletWithdrawal {
  user: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    wallet_balance: number;
    upi_id: string | null;
    bank_name: string | null;
    beneficiary_name: string | null;
    account_number: string | null;
    ifsc_code: string | null;
  };
}

export interface AdminWalletWithdrawalsResponse {
  data: AdminWalletWithdrawal[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export const useAdminWalletWithdrawals = (status?: string, page: number = 1, limit: number = 20) => {
  const http = useHttp();
  const queryKey = ["admin-wallet-withdrawals", status, page, limit];
  return useQuery(
    http.get<AdminWalletWithdrawalsResponse>(
      queryKey,
      `/admin/wallet-withdrawals?status=${status || "ALL"}&page=${page}&limit=${limit}`
    )
  );
};

export const useAdminWalletWithdrawalById = (id: string) => {
  const http = useHttp();
  return useQuery(
    http.get<AdminWalletWithdrawal>(["admin-wallet-withdrawal", id], `/admin/wallet-withdrawals/${id}`, !!id)
  );
};

export const useProcessWalletWithdrawal = () => {
  const queryClient = useQueryClient();
  const http = useHttp();
  return useMutation({
    ...http.post<
      { message: string; withdrawal: WalletWithdrawal },
      { id: string; status: string; reference_id?: string; payment_method?: string; admin_note?: string }
    >(
      (vars) => `/admin/wallet-withdrawals/${vars.id}/process`,
      {
        onSuccess: () => {
          sileo.success({ title: "Withdrawal Processed Successfully" });
          queryClient.invalidateQueries({ queryKey: ["admin-wallet-withdrawals"] });
          queryClient.invalidateQueries({ queryKey: ["wallet-withdrawals"] });
        },
      }
    ),
  });
};