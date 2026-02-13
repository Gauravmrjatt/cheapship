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
import { signInSchema } from "@/lib/validators/auth";
import { z } from "zod";
import {
  Field,
  FieldError,
} from "@/components/ui/field"
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useHttp } from "@/lib/hooks/use-http";
import { User } from "@/lib/store/auth";
import { useMutation } from "@tanstack/react-query";

interface SignInResponse {
  token: string;
  user: User;
}

export default function SignInPage() {
  const { setToken, setUser } = useAuth();
  const router = useRouter();
  const http = useHttp();
  const { mutate, isPending } = useMutation<SignInResponse, Error, z.infer<typeof signInSchema>>(
    http.post<SignInResponse, z.infer<typeof signInSchema>>(
      "/auth/login",
      {
        onSuccess: (data) => {
          setToken(data.token);
          setUser(data.user);
          router.push("/");
        },
      }
    )
  );
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof signInSchema>) {
    mutate(values);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your email below to sign in to your account.
        </CardDescription>
      </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <Field>
              <label>Email</label>
              <Input placeholder="m@example.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
              )}
            </Field>
            <Field>
              <label>Password</label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && (
                <FieldError>{form.formState.errors.password.message}</FieldError>
              )}
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col mt-8">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing In..." : "Sign In"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="underline">
                Sign up
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
              <Link href="/auth/forgot-password" className="underline">
                Forgot password?
              </Link>
            </div>
          </CardFooter>
        </form>
    </Card>
  );
}