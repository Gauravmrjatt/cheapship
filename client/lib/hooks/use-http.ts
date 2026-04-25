"use client";

import { useMutation, QueryKey } from "@tanstack/react-query";
import { sileo } from "sileo";
import { useAuth } from "./use-auth";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` 
  : "http://localhost:3000/api/v1";

interface HttpOptions<TData, TVariables = any> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

interface GetOptions<TData> {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: TData) => void;
}

const getHeaders = (token: string | null) => {
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const useHttp = () => {
  const { token, setToken, setUser } = useAuth();
  const router = useRouter();

  const handleUnauthorized = () => {
    setToken(null);
    setUser(null);
    router.push("/auth/signin");
  };

  const get = <TData>(queryKey: QueryKey, endpoint: string, enabled: boolean = true, options?: GetOptions<TData>) => {
    return {
      queryKey,
      queryFn: async () => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: getHeaders(token),
        });
        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("Session expired");
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch data");
        }
        const data = await response.json();
        if (options?.onSuccess) {
          options.onSuccess(data);
        }
        return data;
      },
      enabled: !!token && enabled,
      ...(options?.refetchInterval && { refetchInterval: options.refetchInterval }),
    };
  };

  const post = <TData = unknown, TVariables = any>(endpoint: string | ((vars: TVariables) => string), options?: HttpOptions<TData, TVariables>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        const resolvedEndpoint = typeof endpoint === "function" ? endpoint(variables) : endpoint;
        const response = await fetch(`${API_BASE_URL}${resolvedEndpoint}`, {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify(variables),
        });
        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("Session expired");
        }
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

  const put = <TData = unknown, TVariables = any>(endpoint: string | ((vars: TVariables) => string), options?: HttpOptions<TData, TVariables>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        const resolvedEndpoint = typeof endpoint === "function" ? endpoint(variables) : endpoint;
        let url = `${API_BASE_URL}${resolvedEndpoint}`;
        let body = JSON.stringify(variables);

        if (typeof variables === "string" && typeof endpoint !== "function") {
          url = `${url}/${variables}`;
          body = JSON.stringify({});
        }

        const response = await fetch(url, {
          method: "PUT",
          headers: getHeaders(token),
          body,
        });
        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("Session expired");
        }
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

  const patch = <TData = unknown, TVariables = any>(endpoint: string | ((vars: TVariables) => string), options?: HttpOptions<TData, TVariables>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        const resolvedEndpoint = typeof endpoint === "function" ? endpoint(variables) : endpoint;
        const response = await fetch(`${API_BASE_URL}${resolvedEndpoint}`, {
          method: "PATCH",
          headers: getHeaders(token),
          body: JSON.stringify(variables),
        });
        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("Session expired");
        }
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

  const del = <TData = unknown, TVariables = any>(endpoint: string | ((vars: TVariables) => string), options?: HttpOptions<TData, TVariables>) => {
    return {
      mutationFn: async (variables: TVariables) => {
        const resolvedEndpoint = typeof endpoint === "function" ? endpoint(variables) : endpoint;
        const url = (typeof variables === "string" && typeof endpoint !== "function")
          ? `${API_BASE_URL}${resolvedEndpoint}/${variables}` 
          : `${API_BASE_URL}${resolvedEndpoint}`;

        const response = await fetch(url, {
          method: "DELETE",
          headers: getHeaders(token),
        });
        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("Session expired");
        }
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
