"use client";

import { signUpSchema } from "@/lib/validators/auth";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useHttp } from "./use-http";
import { useMutation } from "@tanstack/react-query";

export const useSignUp = () => {
  const router = useRouter();
  const http = useHttp();

  return useMutation<void, Error, z.infer<typeof signUpSchema>>(
    http.post<void, z.infer<typeof signUpSchema>>(
      "/auth/register",
      {
        onSuccess: () => {
          router.push("/auth/signin");
        },
      }
    )
  );
};