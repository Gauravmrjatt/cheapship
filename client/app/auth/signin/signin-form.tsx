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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, SmartPhone01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import {Separator} from "@/components/ui/separator";

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

export default function SignInForm() {
  const { setToken, setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const http = useHttp();
  
  const [state, setState] = useState({
    loginMethod: "otp" as "password" | "otp",
    otpTab: "email" as "email" | "mobile",
    step: 1 as 1 | 2,
    email: "",
    countdown: 0,
    redirectTo: "/",
  });

  useEffect(() => {
    const redirect = searchParams.get("redirect") || "/";
    setState(prev => ({ ...prev, redirectTo: redirect }));
  }, [searchParams]);

  const passwordLoginMutation = useMutation<SignInResponse, Error, PasswordFormData>(
    http.post<SignInResponse, PasswordFormData>("/auth/login", {
      onSuccess: (data) => {
        setToken(data.token);
        setUser(data.user);
        router.push(state.redirectTo);
      },
      onError: (error) => {
        sileo.error({ title: "Login Failed", description: error.message });
      }
    })
  );

  const sendLoginOtpMutation = useMutation<SendOtpResponse, Error, OtpRequestFormData>(
    http.post<SendOtpResponse, OtpRequestFormData>("/auth/send-login-otp", {
      onSuccess: (data) => {
        setState(prev => ({
          ...prev,
          step: 2,
          countdown: data.expiresIn,
          email: data.email || ""
        }));
        sileo.success({ title: "OTP Sent", description: data.message });
      },
      onError: (error) => {
        sileo.error({ title: "Error", description: error.message });
      }
    })
  );

  const verifyOtpMutation = useMutation<SignInResponse, Error, { email: string } & OtpFormData>(
    http.post<SignInResponse, { email: string } & OtpFormData>("/auth/verify-login-otp", {
      onSuccess: (data) => {
        setToken(data.token);
        setUser(data.user);
        router.push(state.redirectTo);
      },
      onError: (error) => {
        sileo.error({ title: "Verification Failed", description: error.message });
      }
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
    if (state.countdown > 0) {
      const timer = setTimeout(() => setState(prev => ({ ...prev, countdown: prev.countdown - 1 })), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.countdown]);

  function onPasswordSubmit(values: PasswordFormData) {
    passwordLoginMutation.mutate(values);
  }

  function onSendOtp(values: OtpRequestFormData) {
    // Only send the field relevant to the current tab
    const payload: OtpRequestFormData = {};
    if (state.otpTab === "email") {
      payload.email = values.email?.trim().toLowerCase();
      setState(prev => ({ ...prev, email: payload.email || "" }));
    } else {
      payload.mobile = values.mobile?.trim();
    }
    sendLoginOtpMutation.mutate(payload);
  }

  function onVerifyOtp(values: OtpFormData) {
    verifyOtpMutation.mutate({ email: state.email, ...values });
  }

  function handleResendOtp() {
    if (state.countdown > 0) return;
    onSendOtp(otpRequestForm.getValues());
  }

  return (
    <Card className="w-full max-w-sm ">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl tracking-tight">Sign In</CardTitle>
        <CardDescription>
          {state.loginMethod === "otp" && state.step === 1
            ? "Choose your login method to receive an OTP"
            : state.loginMethod === "otp" && state.step === 2
              ? "Enter the 6-digit OTP sent to you"
              : "Enter your credentials to sign in"}
        </CardDescription>
      </CardHeader>

      {state.loginMethod === "password" ? (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
          <CardContent className="grid gap-4">
            <Field>
              <label htmlFor="signin-email" className="text-sm font-medium">Email</label>
              <Input id="signin-email" placeholder="m@example.com" {...passwordForm.register("email")} />
              {passwordForm.formState.errors.email && (
                <FieldError>{passwordForm.formState.errors.email.message}</FieldError>
              )}
            </Field>
            <Field>
              <label htmlFor="signin-password" className="text-sm font-medium">Password</label>
              <Input id="signin-password" type="password" {...passwordForm.register("password")} />
              {passwordForm.formState.errors.password && (
                <FieldError>{passwordForm.formState.errors.password.message}</FieldError>
              )}
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-8">
            <Button type="submit" className="w-full " disabled={passwordLoginMutation.isPending}>
              {passwordLoginMutation.isPending ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" /> : null}
              {passwordLoginMutation.isPending ? "Signing In..." : "Sign In"}
            </Button>
            <div className="flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="link"
                className="text-xs"
                onClick={(e) => { e.preventDefault(); setState(prev => ({ ...prev, loginMethod: "otp" })) }}
              >
                Sign in with OTP instead
              </Button>
              <div className="text-xs text-muted-foreground flex gap-2">
                <Link href="/auth/forgot-password" title="reset password" className="underline hover:text-primary">
                  Forgot password?
                </Link>
                
              </div>
            </div>
            <Separator />
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="underline font-medium text-primary">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      ) : state.step === 1 ? (
        <form onSubmit={otpRequestForm.handleSubmit(onSendOtp)}>
          <CardContent className="grid gap-6">
            <Tabs value={state.otpTab} onValueChange={(v) => setState(prev => ({ ...prev, otpTab: v as any }))} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="mobile" className="gap-2">
                  <HugeiconsIcon icon={SmartPhone01Icon} size={16} />
                  Number
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2">
                  <HugeiconsIcon icon={Mail01Icon} size={16} />
                  Email
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="mobile" className="pt-4 animate-in fade-in duration-300">
                <Field>
                  <label htmlFor="signin-mobile" className=" ">Mobile Number</label>
                  <div className="flex mt-1.5">
                    <span className="inline-flex items-center px-3 rounded-l-full border border-r-0 bg-muted text-muted-foreground text-sm">
                      +91
                    </span>
                    <Input 
                      id="signin-mobile"
                      className="rounded-l-none" 
                      placeholder="9876543210" 
                      maxLength={10}
                      {...otpRequestForm.register("mobile")} 
                    />
                  </div>
                  {otpRequestForm.formState.errors.mobile && (
                    <FieldError>{otpRequestForm.formState.errors.mobile.message}</FieldError>
                  )}
                </Field>
              </TabsContent>

              <TabsContent value="email" className="pt-4 animate-in fade-in duration-300">
                <Field>
                  <label htmlFor="signin-otp-email" className="">Email Address</label>
                  <Input
                    id="signin-otp-email"
                    className="mt-1.5"
                    placeholder="m@example.com"
                    type="email"
                    {...otpRequestForm.register("email")}
                  />
                  {otpRequestForm.formState.errors.email && (
                    <FieldError>{otpRequestForm.formState.errors.email.message}</FieldError>
                  )}
                </Field>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-8">
            <Button type="submit" className="w-full " disabled={sendLoginOtpMutation.isPending}>
              {sendLoginOtpMutation.isPending ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" /> : null}
              {sendLoginOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="text-xs"
              onClick={(e) => { e.preventDefault(); setState(prev => ({ ...prev, loginMethod: "password" })) }}
            >
              Sign in with password instead
            </Button>
            <Separator />
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="underline font-medium text-primary">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onVerifyOtp)}>
          <CardContent className="grid gap-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">OTP sent to your {state.otpTab}</p>
              <p className="font-bold text-lg">{state.otpTab === "email" ? state.email : `+91 ${otpRequestForm.getValues("mobile")}`}</p>
            </div>
            <Field>
              <Input
                placeholder="000000"
                maxLength={6}
                className="text-center text-3xl tracking-[0.5em] h-14 font-bold"
                {...otpForm.register("otp")}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  otpForm.setValue("otp", value);
                }}
              />
              {otpForm.formState.errors.otp && (
                <FieldError className="text-center">{otpForm.formState.errors.otp.message}</FieldError>
              )}
            </Field>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-xs"
                onClick={handleResendOtp}
                disabled={state.countdown > 0 || sendLoginOtpMutation.isPending}
              >
                {state.countdown > 0 ? `Resend OTP in ${state.countdown}s` : "Resend OTP"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full h-11" disabled={verifyOtpMutation.isPending}>
              {verifyOtpMutation.isPending ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" /> : null}
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Sign In"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => setState(prev => ({ ...prev, step: 1 }))}
            >
              Back
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
