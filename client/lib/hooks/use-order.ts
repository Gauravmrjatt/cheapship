"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { sileo } from "sileo";
import { useAuthStore } from "../store/auth";

export const useOrder = (orderId: string) => {
  const { get } = useHttp();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.user_type === "ADMIN";
  const endpoint = isAdmin ? `/admin/orders/${orderId}` : `/orders/${orderId}`;
  const queryKey = isAdmin ? ["admin-order", orderId] : ["order", orderId];

  return useQuery(get(queryKey, endpoint, !!orderId));
};

export const useAssignAWB = () => {
  const { post } = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    ...post<any, { orderId: string; status?: string }>(
      ({ orderId }) => `/orders/${orderId}/awb`,
      {
        onSuccess: (_, { orderId }) => {
          sileo.success({ title: "AWB Assigned", description: "AWB has been successfully assigned to the shipment." });
          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (error: any) => {
          sileo.error({ title: "Failed to assign AWB", description: error.message || "An error occurred while assigning AWB." });
        }
      }
    )
  });
};

export const useSchedulePickup = () => {
  const { post } = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    ...post<any, { orderId: string; pickup_date?: string }>(
      ({ orderId, pickup_date }) => `/orders/${orderId}/pickup`,
      {
        onSuccess: (_, { orderId }) => {
          sileo.success({ title: "Pickup Scheduled", description: "Pickup has been successfully scheduled." });
          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (error: any) => {
          sileo.error({ title: "Failed to schedule pickup", description: error.message || "An error occurred while scheduling pickup." });
        }
      }
    )
  });
};

export const useGenerateLabel = () => {
  const { post } = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    ...post<any, { orderId: string }>(
      ({ orderId }) => `/orders/${orderId}/label`,
      {
        onSuccess: (_, { orderId }) => {
          sileo.success({ title: "Label Generated", description: "Shipping label has been successfully generated." });
          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (error: any) => {
          sileo.error({ title: "Failed to generate label", description: error.message || "An error occurred while generating label." });
        }
      }
    )
  });
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
