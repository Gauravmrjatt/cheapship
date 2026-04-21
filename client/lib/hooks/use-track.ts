"use client";

import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface TrackingActivity {
  id: string;
  order_id: string;
  status: string;
  status_date: string;
  location: string;
  shipment_status: string;
  activity: string;
  created_at: string;
}

export interface TrackingUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

export interface TrackingOrder {
  id: string;
  shipment_status: string;
  tracking_number: string;
  courier_name: string;
  label_url: string | null;
  created_at: string;
  delivered_at: string | null;
  user?: TrackingUser;
}

export interface LiveStatus {
  current_status: string;
  status: string;
  track_url: string | null;
  estimated_delivery: string | null;
  courier: string;
  tracking_number: string;
  activities: TrackingActivity[];
}

export interface TrackingResponse {
  order: TrackingOrder;
  live_status: LiveStatus | null;
  history: TrackingActivity[];
}

export const useTrackOrder = (awb: string) => {
  return useQuery({
    queryKey: ["track", awb],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/track?awb=${encodeURIComponent(awb)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to track order");
      }
      
      return response.json() as Promise<TrackingResponse>;
    },
    enabled: !!awb && awb.length >= 5,
    retry: false,
  });
};