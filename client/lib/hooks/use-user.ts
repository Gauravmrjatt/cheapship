"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { useAuthStore } from "@/lib/store/auth";
import { useEffect } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  wallet_balance: number;
  user_type: string;
  referer_code: string | null;
  referred_by: string | null;
  commission_rate: number | null;
  franchise_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useUser = () => {
  const http = useHttp();
  const { setUser } = useAuthStore();

  const query = useQuery(http.get<UserProfile>(["user-profile"], "/auth/me"));

  useEffect(() => {
    if (query.data) {
      setUser({
        id: query.data.id,
        name: query.data.name,
        email: query.data.email,
        wallet_balance: Number(query.data.wallet_balance),
      });
    }
  }, [query.data, setUser]);

  return query;
};
