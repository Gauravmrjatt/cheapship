"use client";

import { useMutation, QueryKey } from "@tanstack/react-query";
import { sileo } from "sileo";
import { useAuth } from "./use-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1" || "http://localhost:3000";

interface HttpOptions<TData, TVariables = any> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

const getHeaders = (token: string | null) => {
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const useHttp = () => {
  const { token } = useAuth();

  const get = <TData>(queryKey: QueryKey, endpoint: string, enabled: boolean = true, options?: { refetchInterval?: number }) => {
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
      ...(options?.refetchInterval && { refetchInterval: options.refetchInterval }),
    };
  };

  const post = <TData = unknown, TVariables = unknown>(endpoint: string, options?: HttpOptions<TData, TVariables>) => {
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
      onError: (error: Error, variables: TVariables) => {
        sileo.error({ title: "Error" , description: error.message });
        if (options?.onError) {
          options.onError(error, variables);
        }
      },
    };
  };

  const put = <TData = unknown, TVariables = unknown>(endpoint: string, options?: HttpOptions<TData, TVariables>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        let url = `${API_BASE_URL}${endpoint}`;
        let body = JSON.stringify(variables);

        if (typeof variables === "string") {
          url = `${url}/${variables}`;
          body = JSON.stringify({});
        }

        const response = await fetch(url, {
          method: "PUT",
          headers: getHeaders(token),
          body,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "API request failed");
        }
        return response.json();
      },
      onSuccess: options?.onSuccess,
      onError: (error: Error, variables: TVariables) => {
        sileo.error({ title: "Error" , description: error.message });
        if (options?.onError) {
          options.onError(error, variables);
        }
      },
    };
  };

  const patch = <TData = unknown, TVariables = unknown>(endpoint: string, options?: HttpOptions<TData, TVariables>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "PATCH",
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
      onError: (error: Error, variables: TVariables) => {
        sileo.error({ title: "Error" , description: error.message });
        if (options?.onError) {
          options.onError(error, variables);
        }
      },
    };
  };

  const del = <TData = unknown, TVariables = unknown>(endpoint: string, options?: HttpOptions<TData, TVariables>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        const url = typeof variables === "string" 
          ? `${API_BASE_URL}${endpoint}/${variables}` 
          : `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
          method: "DELETE",
          headers: getHeaders(token),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "API request failed");
        }
        return response.json();
      },
      onSuccess: options?.onSuccess,
      onError: (error: Error, variables: TVariables) => {
        sileo.error({ title: "Error" , description: error.message });
        if (options?.onError) {
          options.onError(error, variables);
        }
      },
    };
  };

  return { get, post, put, patch, del };
};
