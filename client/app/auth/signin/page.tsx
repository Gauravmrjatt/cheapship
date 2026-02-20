"use client";

import { useState, useEffect, Suspense } from "react";
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
import { signInSchema, signInOtpSchema, otpSchema } from "@/lib/validators/auth";
import { z } from "zod";
import {
  Field,
  FieldError,
} from "@/components/ui/field";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useHttp } from "@/lib/hooks/use-http";
import { User } from "@/lib/store/auth";
import { useMutation } from "@tanstack/react-query";
import { sileo } from "sileo";

interface SignInResponse {
  token: string;
  user: User;
}

interface SendOtpResponse {
  message: string;
  expiresIn: number;
  email?: string;
}

type PasswordFormData = z.infer<typeof signInSchema>;
type OtpRequestFormData = z.infer<typeof signInOtpSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

function SignInForm() {
  const { setToken, setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const http = useHttp();
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("otp");
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  
  const redirectTo = searchParams.get("redirect") || "/";

  const passwordLoginMutation = useMutation<SignInResponse, Error, PasswordFormData>(
    http.post<SignInResponse, PasswordFormData>("/auth/login", {
      onSuccess: (data) => {
        setToken(data.token);
        setUser(data.user);
        router.push(redirectTo);
      },
    })
  );

  const sendLoginOtpMutation = useMutation<SendOtpResponse, Error, OtpRequestFormData>(
    http.post<SendOtpResponse, OtpRequestFormData>("/auth/send-login-otp", {
      onSuccess: (data) => {
        setStep(2);
        setCountdown(Math.floor(data.expiresIn / 1000));
        setEmail(data.email || "");
        sileo.success({ title: "OTP Sent", description: data.message });
      },
    })
  );

  const verifyOtpMutation = useMutation<SignInResponse, Error, { email: string } & OtpFormData>(
    http.post<SignInResponse, { email: string } & OtpFormData>("/auth/verify-login-otp", {
      onSuccess: (data) => {
        setToken(data.token);
        setUser(data.user);
        router.push(redirectTo);
      },
    })
  );

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const otpRequestForm = useForm<OtpRequestFormData>({
    resolver: zodResolver(signInOtpSchema),
    defaultValues: {
      email: "",
      mobile: "",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  function onPasswordSubmit(values: PasswordFormData) {
    passwordLoginMutation.mutate(values);
  }

  function onSendOtp(values: OtpRequestFormData) {
    if (values.email) {
      setEmail(values.email);
    }
    sendLoginOtpMutation.mutate(values);
  }

  function onVerifyOtp(values: OtpFormData) {
    verifyOtpMutation.mutate({ email, ...values });
  }

  function handleResendOtp() {
    if (countdown > 0) return;
    const values = otpRequestForm.getValues();
    sendLoginOtpMutation.mutate(values);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          {loginMethod === "otp" && step === 1
            ? "Enter your email or mobile to receive an OTP"
            : loginMethod === "otp" && step === 2
            ? "Enter the OTP sent to your email"
            : "Enter your credentials to sign in"}
        </CardDescription>
      </CardHeader>

      {loginMethod === "password" ? (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
          <CardContent className="grid gap-4">
            <Field>
              <label>Email</label>
              <Input placeholder="m@example.com" {...passwordForm.register("email")} />
              {passwordForm.formState.errors.email && (
                <FieldError>{passwordForm.formState.errors.email.message}</FieldError>
              )}
            </Field>
            <Field>
              <label>Password</label>
              <Input type="password" {...passwordForm.register("password")} />
              {passwordForm.formState.errors.password && (
                <FieldError>{passwordForm.formState.errors.password.message}</FieldError>
              )}
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col mt-8">
            <Button type="submit" className="w-full" disabled={passwordLoginMutation.isPending}>
              {passwordLoginMutation.isPending ? "Signing In..." : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="mt-2"
              onClick={() => setLoginMethod("otp")}
            >
              Sign in with OTP instead
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
              {" | "}
              <Link href="/admin/forgot-password" className="underline">
                Admin?
              </Link>
            </div>
          </CardFooter>
        </form>
      ) : step === 1 ? (
        <form onSubmit={otpRequestForm.handleSubmit(onSendOtp)}>
          <CardContent className="grid gap-4">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                placeholder="m@example.com"
                type="email"
                {...otpRequestForm.register("email")}
              />
              {otpRequestForm.formState.errors.email && (
                <FieldError>{otpRequestForm.formState.errors.email.message}</FieldError>
              )}
            </Field>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Field>
              <FieldLabel>Mobile</FieldLabel>
              <Input placeholder="1234567890" {...otpRequestForm.register("mobile")} />
              {otpRequestForm.formState.errors.mobile && (
                <FieldError>{otpRequestForm.formState.errors.mobile.message}</FieldError>
              )}
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={sendLoginOtpMutation.isPending}>
              {sendLoginOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="mt-2"
              onClick={() => setLoginMethod("password")}
            >
              Sign in with password instead
            </Button>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onVerifyOtp)}>
          <CardContent className="grid gap-4">
            <div className="text-center text-sm text-muted-foreground mb-2">
              OTP sent to <span className="font-medium">{email}</span>
            </div>
            <Field>
              <FieldLabel>Enter 6-digit OTP</FieldLabel>
              <Input
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                {...otpForm.register("otp")}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  otpForm.setValue("otp", value);
                }}
              />
              {otpForm.formState.errors.otp && (
                <FieldError>{otpForm.formState.errors.otp.message}</FieldError>
              )}
            </Field>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto"
              onClick={handleResendOtp}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={verifyOtpMutation.isPending}>
              {verifyOtpMutation.isPending ? "Verifying..." : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
