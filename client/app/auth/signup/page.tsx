"use client";

import { useEffect, Suspense } from "react";
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
import { signUpSchema } from "@/lib/validators/auth";
import { z } from "zod";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"; 
import { useRouter, useSearchParams } from "next/navigation";
import { useHttp } from "@/lib/hooks/use-http"; 
import { useMutation } from "@tanstack/react-query";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const http = useHttp(); 
  
  const refCode = searchParams.get("ref");

  const { mutate, isPending } = useMutation<void, Error, z.infer<typeof signUpSchema>>(
    http.post<void, z.infer<typeof signUpSchema>>(
      "/auth/register",
      {
        onSuccess: () => {
          router.push("/auth/signin");
        },
      }
    )
  );

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      referred_by: refCode || "",
    },
  });

  // Update referred_by when refCode changes
  useEffect(() => {
    if (refCode) {
      form.setValue("referred_by", refCode);
    }
  }, [refCode, form]);

  function onSubmit(values: z.infer<typeof signUpSchema>) {
    mutate(values);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          {refCode ? (
            <span className="text-primary font-semibold">Joining via referral code: {refCode}</span>
          ) : (
            "Enter your information to create an account."
          )}
        </CardDescription>
      </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input placeholder="John Doe" {...form.register("name")} />
              {form.formState.errors.name && (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input placeholder="m@example.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Mobile</FieldLabel>
              <Input placeholder="1234567890" {...form.register("mobile")} />
              {form.formState.errors.mobile && (
                <FieldError>{form.formState.errors.mobile.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && (
                <FieldError>{form.formState.errors.password.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Confirm Password</FieldLabel>
              <Input type="password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && (
                <FieldError>{form.formState.errors.confirmPassword.message}</FieldError>
              )}
            </Field>
            {/* Hidden field for referral code */}
            <input type="hidden" {...form.register("referred_by")} />
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing Up..." : "Sign Up"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}