"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "./use-http";
import { sileo } from "sileo";

export interface WeightDispute {
  id: string;
  order_id: string;
  user_id: string;
  applied_weight: number;
  charged_weight: number;
  applied_amount: number;
  charged_amount: number;
  difference_amount: number;
  product_category: string | null;
  discrepancy_description: string | null;
  weight_scale_image: string | null;
  packed_box_image: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  action_reason: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    tracking_number: string;
    courier_name: string;
  };
}

export const useWeightDisputes = (page: number = 1, pageSize: number = 10, status?: string) => {
  const http = useHttp();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (status && status !== 'ALL') queryParams.append("status", status);

  return useQuery(http.get<{
    data: WeightDispute[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  }>(["weight-disputes", page, pageSize, status], `/disputes/weight?${queryParams.toString()}`));
};

export const useRaiseWeightDispute = () => {
  const queryClient = useQueryClient();
  const http = useHttp();

  return useMutation({
    ...http.post<any, {
      awb_number: string;
      declared_weight: number;
      charged_weight: number;
      product_category: string;
      description: string;
      weight_scale_image?: string;
      packed_box_image?: string;
    }>("/disputes/weight/user", {
      onSuccess: (data) => {
        sileo.success({ title: "Dispute Raised", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["weight-disputes"] });
      },
    })
  });
};
