"use client";

import { useMutation, QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./use-auth";

const API_BASE_URL = "http://localhost:3001/api/v1";

interface HttpOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

const getHeaders = (token: string | null) => {
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const useHttp = () => {
  const { token } = useAuth();

  const get = <TData>(queryKey: QueryKey, endpoint: string, enabled: boolean = true) => {
    return {
      queryKey,
      queryFn: async () => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: getHeaders(token),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch data");
        }
        return response.json();
      },
      enabled: !!token && enabled,
    };
  };

  const post = <TData, TVariables>(endpoint: string, options?: HttpOptions<TData>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify(variables),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "API request failed");
        }
        return response.json();
      },
      onSuccess: options?.onSuccess,
      onError: (error: Error) => {
        toast.error(error.message);
        if (options?.onError) {
          options.onError(error);
        }
      },
    };
  };

  const put = <TData, TVariables>(endpoint: string, options?: HttpOptions<TData>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "PUT",
          headers: getHeaders(token),
          body: JSON.stringify(variables),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "API request failed");
        }
        return response.json();
      },
      onSuccess: options?.onSuccess,
      onError: (error: Error) => {
        toast.error(error.message);
        if (options?.onError) {
          options.onError(error);
        }
      },
    };
  };

  const del = <TData, TVariables>(endpoint: string, options?: HttpOptions<TData>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "DELETE",
          headers: getHeaders(token),
          body: JSON.stringify(variables),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "API request failed");
        }
        return response.json();
      },
      onSuccess: options?.onSuccess,
      onError: (error: Error) => {
        toast.error(error.message);
        if (options?.onError) {
          options.onError(error);
        }
      },
    };
  };

  return { get, post, put, del };
};
