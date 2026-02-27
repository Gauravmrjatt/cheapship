"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./use-http";

export interface LoginSession {
  id: string;
  user_id: string;
  ip_address: string | null;
  device_info: string | null;
  user_agent: string | null;
  login_status: string;
  login_at: string;
}

export const useLoginHistory = () => {
  const http = useHttp();
  return useQuery(http.get<LoginSession[]>(["login-history"], "/auth/login-history"));
};
