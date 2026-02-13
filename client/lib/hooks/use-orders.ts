"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export const useOrders = (page: number, pageSize: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["orders", page, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:3001/api/v1/orders?page=${page}&pageSize=${pageSize}`,
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