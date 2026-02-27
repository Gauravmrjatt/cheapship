"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { useAuthStore } from "@/lib/store/auth";
import { useEffect } from "react";
import { sileo } from "sileo";

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
  min_commission_rate: number | null;
  max_commission_rate: number | null;
  default_referred_pickup_id: string | null;
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
        mobile: query.data.mobile,
        wallet_balance: Number(query.data.wallet_balance),
        user_type: query.data.user_type,
      });
    }
  }, [query.data, setUser]);

  return query;
};

export const useUpdateMyCommissionRate = () => {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commission_rate: number) =>
      fetch(`/api/v1/users/commission-rate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ commission_rate })
      }).then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.message || "Failed to update") });
        return res.json();
      }),
    onSuccess: () => {
      sileo.success({ title: "Commission rate updated!" });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (err: any) => {
      sileo.error({ title: "Update failed", description: err.message });
    }
  });
};

export const useSetDefaultPickup = () => {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (address_id: string) =>
      fetch(`/api/v1/users/default-pickup`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ address_id })
      }).then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.message || "Failed to update") });
        return res.json();
      }),
    onSuccess: () => {
      sileo.success({ title: "Default signup address updated!" });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (err: any) => {
      sileo.error({ title: "Update failed", description: err.message });
    }
  });
};
