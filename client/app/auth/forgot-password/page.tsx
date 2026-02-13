"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { z } from "zod";
import { useHttp } from "@/lib/hooks/use-http";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

interface ForgotPasswordResponse {
  message: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const http = useHttp();
  const { mutate, isPending } = useMutation<ForgotPasswordResponse, Error, z.infer<typeof forgotPasswordSchema>>(
    http.post<ForgotPasswordResponse, z.infer<typeof forgotPasswordSchema>>(
      "/auth/forgot-password",
      {
        onSuccess: (data) => {
          toast.success(data.message);
          router.push("/auth/signin");
        },
      }
    )
  );
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    mutate(values);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email to reset your password.
        </CardDescription>
      </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input placeholder="m@example.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
              )}
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Remembered your password?{" "}
              <Link href="/auth/signin" className="underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
    </Card>
  );
}