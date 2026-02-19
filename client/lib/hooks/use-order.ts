"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./use-http";

export const useOrder = (orderId: string) => {
  const { get } = useHttp();

  return useQuery(get(["order", orderId], `/orders/${orderId}`, !!orderId));
};

export const useLiveOrderStatus = (orderId: string, enabled: boolean = true) => {
  const { get } = useHttp();

  return useQuery(
    get(["liveOrderStatus", orderId], `/orders/${orderId}/live-status`, enabled && !!orderId, {
      refetchInterval: 30000,
    })
  );
};

export const useOrderTracking = (orderId: string, enabled: boolean = true) => {
  const { get } = useHttp();

  return useQuery(
    get(["orderTracking", orderId], `/orders/${orderId}/tracking`, enabled && !!orderId, {
      refetchInterval: 60000,
    })
  );
};
