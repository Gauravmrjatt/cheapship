"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./use-http";

export const useOrder = (orderId: string) => {
  const { get } = useHttp();

  return useQuery(get(["order", orderId], `/orders/${orderId}`, !!orderId));
};