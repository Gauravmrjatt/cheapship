"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";

export const useOrder = (orderId: string) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:3001/api/v1/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }
      return response.json();
    },
    enabled: !!token && !!orderId,
  });
};