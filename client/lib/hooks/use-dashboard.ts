"use client";

import { useQuery } from "@tanstack/react-query";
import { useHttp } from "./use-http";

export const useDashboard = () => {
  const { get } = useHttp();

  return useQuery(get(["dashboard"], "/dashboard"));
};