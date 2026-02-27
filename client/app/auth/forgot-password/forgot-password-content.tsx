"use client";

import { useState, useEffect } from "react";
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
import { forgotPasswordSchema, resetPasswordSchema, otpSchema } from "@/lib/validators/auth";
import { z } from "zod";
import { useHttp } from "@/lib/hooks/use-http";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { useMutation } from "@tanstack/react-query";

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

interface SendOtpResponse {
  message: string;
  expiresIn: number;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const http = useHttp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  const sendOtpMutation = useMutation<SendOtpResponse, Error, ForgotPasswordFormData>(
    http.post<SendOtpResponse, ForgotPasswordFormData>("/auth/forgot-password", {
      onSuccess: (data) => {
        setStep(2);
        setCountdown(data.expiresIn);
        sileo.success({ title: "OTP Sent", description: data.message });
      },
    })
  );

  const resetPasswordMutation = useMutation<{ message: string }, Error, ResetPasswordFormData>(
    http.put<{ message: string }, ResetPasswordFormData>("/auth/reset-password", {
      onSuccess: (data) => {
        sileo.success({ title: "Success", description: data.message });
        router.push("/auth/signin");
      },
    })
  );

  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  function onSendOtp(values: ForgotPasswordFormData) {
    const trimmedEmail = values.email.trim().toLowerCase();
    setEmail(trimmedEmail);
    sendOtpMutation.mutate({ email: trimmedEmail });
  }

  function onVerifyOtp(values: OtpFormData) {
    resetPasswordForm.setValue("email", email);
    resetPasswordForm.setValue("otp", values.otp);
    setStep(3);
  }

  function onResetPassword(values: ResetPasswordFormData) {
    resetPasswordMutation.mutate(values);
  }

  function handleResendOtp() {
    if (countdown > 0) return;
    sendOtpMutation.mutate({ email });
  }

  const stepDescriptions = {
    1: "Enter your email to receive a password reset OTP.",
    2: "Enter the OTP sent to your email.",
    3: "Create your new password.",
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>{stepDescriptions[step]}</CardDescription>
      </CardHeader>

      {step === 1 ? (
        <form onSubmit={emailForm.handleSubmit(onSendOtp)}>
          <CardContent className="grid gap-4">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input placeholder="m@example.com" type="email" {...emailForm.register("email")} />
              {emailForm.formState.errors.email && (
                <FieldError>{emailForm.formState.errors.email.message}</FieldError>
              )}
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={sendOtpMutation.isPending}>
              {sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Remembered your password?{" "}
              <Link href="/auth/signin" className="underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      ) : step === 2 ? (
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
            <Button type="submit" className="w-full">
              Verify OTP
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
      ) : (
        <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)}>
          <CardContent className="grid gap-4">
            <Field>
              <FieldLabel>New Password</FieldLabel>
              <Input
                type="password"
                {...resetPasswordForm.register("newPassword")}
              />
              {resetPasswordForm.formState.errors.newPassword && (
                <FieldError>{resetPasswordForm.formState.errors.newPassword.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Confirm New Password</FieldLabel>
              <Input
                type="password"
                {...resetPasswordForm.register("confirmPassword")}
              />
              {resetPasswordForm.formState.errors.confirmPassword && (
                <FieldError>{resetPasswordForm.formState.errors.confirmPassword.message}</FieldError>
              )}
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
