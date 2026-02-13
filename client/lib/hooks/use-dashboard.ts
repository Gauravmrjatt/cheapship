"use client";

import { useHttp } from "./use-http";

import { DashboardData } from "@/types/dashboard";



export const useDashboard = () => {
  const http = useHttp();
  return http.get<DashboardData>(["dashboard"], "/dashboard");
};
