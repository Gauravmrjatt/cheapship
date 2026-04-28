"use client";

import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` 
  : "http://localhost:3000/api/v1";

const getHeaders = () => {
  return {
    "Content-Type": "application/json",
  };
};

export interface SecurityFeeConfig {
  feeType: string;
  feeValue: number;
}

export const useSecurityFeeConfig = () => {
  return useQuery({
    queryKey: ["security-fee-config"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/settings/security-fee`, {
        headers: getHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch security fee config");
      }
      return response.json() as Promise<SecurityFeeConfig>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// For server-side or public access without token
export const getSecurityFeeConfig = async (): Promise<SecurityFeeConfig> => {
  const response = await fetch(`${API_BASE_URL}/settings/security-fee`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch security fee config");
  }
  return response.json();
};