"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export const useDashboard = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:3001/api/v1/dashboard`,
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