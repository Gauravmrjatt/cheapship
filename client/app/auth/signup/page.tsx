"use client";

import { useEffect, useState, Suspense } from "react";
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
import { signUpSchema, otpSchema } from "@/lib/validators/auth";
import { z } from "zod";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"; 
import { useRouter, useSearchParams } from "next/navigation";
import { useHttp } from "@/lib/hooks/use-http"; 
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { User } from "@/lib/store/auth";
import { sileo } from "sileo";

type SignUpFormData = z.infer<typeof signUpSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

interface SendOtpResponse {
  message: string;
  expiresIn: number;
}

interface VerifyOtpResponse {
  token: string;
  user: User;
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const http = useHttp();
  const { setToken, setUser } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  
  const refCode = searchParams.get("ref");

  const sendOtpMutation = useMutation<SendOtpResponse, Error, SignUpFormData>(
    http.post<SendOtpResponse, SignUpFormData>("/auth/send-registration-otp", {
      onSuccess: (data) => {
        setStep(2);
        setCountdown(Math.floor(data.expiresIn / 1000));
        sileo.success({ title: "OTP Sent", description: data.message });
      },
    })
  );

  const verifyOtpMutation = useMutation<VerifyOtpResponse, Error, { email: string } & OtpFormData>(
    http.post<VerifyOtpResponse, { email: string } & OtpFormData>("/auth/verify-registration-otp", {
      onSuccess: (data) => {
        setToken(data.token);
        setUser(data.user);
        sileo.success({ title: "Account Created", description: "Welcome to CheapShip!" });
        router.push("/");
      },
    })
  );

  const signUpForm = useForm<SignUpFormData>({
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

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (refCode) {
      signUpForm.setValue("referred_by", refCode);
    }
  }, [refCode, signUpForm]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  function onSendOtp(values: SignUpFormData) {
    setEmail(values.email);
    sendOtpMutation.mutate(values);
  }

  function onVerifyOtp(values: OtpFormData) {
    verifyOtpMutation.mutate({ email, ...values });
  }

  function handleResendOtp() {
    if (countdown > 0) return;
    setResendDisabled(true);
    const values = signUpForm.getValues();
    sendOtpMutation.mutate(values);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          {step === 1 ? (
            refCode ? (
              <span className="text-primary font-semibold">Joining via referral code: {refCode}</span>
            ) : (
              "Enter your information to create an account."
            )
          ) : (
            "Enter the OTP sent to your email"
          )}
        </CardDescription>
      </CardHeader>
      
      {step === 1 ? (
        <form onSubmit={signUpForm.handleSubmit(onSendOtp)}>
          <CardContent className="grid gap-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input placeholder="John Doe" {...signUpForm.register("name")} />
              {signUpForm.formState.errors.name && (
                <FieldError>{signUpForm.formState.errors.name.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input placeholder="m@example.com" type="email" {...signUpForm.register("email")} />
              {signUpForm.formState.errors.email && (
                <FieldError>{signUpForm.formState.errors.email.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Mobile</FieldLabel>
              <Input placeholder="1234567890" {...signUpForm.register("mobile")} />
              {signUpForm.formState.errors.mobile && (
                <FieldError>{signUpForm.formState.errors.mobile.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input type="password" {...signUpForm.register("password")} />
              {signUpForm.formState.errors.password && (
                <FieldError>{signUpForm.formState.errors.password.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Confirm Password</FieldLabel>
              <Input type="password" {...signUpForm.register("confirmPassword")} />
              {signUpForm.formState.errors.confirmPassword && (
                <FieldError>{signUpForm.formState.errors.confirmPassword.message}</FieldError>
              )}
            </Field>
            <input type="hidden" {...signUpForm.register("referred_by")} />
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={sendOtpMutation.isPending}>
              {sendOtpMutation.isPending ? "Sending OTP..." : "Continue"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="underline">
                Sign in
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
              disabled={countdown > 0 || resendDisabled}
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={verifyOtpMutation.isPending}>
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Create Account"}
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

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
