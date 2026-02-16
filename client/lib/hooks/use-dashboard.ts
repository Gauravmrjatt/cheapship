"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"; 
export const useDashboard = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch(
        `${BASE_URL}/api/v1/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
    enabled: !!token,
  });
};