"use client";

import { useEffect, useState } from "react";
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
import { mobileRegSchema, otpRegSchema, detailsRegSchema } from "@/lib/validators/auth";
import { z } from "zod";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useHttp } from "@/lib/hooks/use-http";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { User } from "@/lib/store/auth";
import { sileo } from "sileo";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Edit03Icon } from "@hugeicons/core-free-icons";
import { useFirebaseOtp } from "@/lib/hooks/use-firebase-otp";

type MobileRegFormData = z.infer<typeof mobileRegSchema>;
type OtpRegFormData = z.infer<typeof otpRegSchema>;
type DetailsRegFormData = z.infer<typeof detailsRegSchema>;

interface VerifyMobileResponse {
  message: string;
  verificationToken: string;
}

interface InitMobileResponse {
  message: string;
  expiresIn: number;
  alreadyVerified?: boolean;
}

interface CompleteRegResponse {
  token: string;
  user: User;
}

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const http = useHttp();
  const { setToken, setUser } = useAuth();
  const firebaseOtp = useFirebaseOtp();
  
  const [state, setState] = useState({
    step: 1 as 1 | 2 | 3,
    mobile: "",
    verificationToken: "",
    firebaseIdToken: "",
    countdown: 0,
  });

  // Mutations
  const initMobileMutation = useMutation<InitMobileResponse, Error, MobileRegFormData>(
    http.post<InitMobileResponse, MobileRegFormData>("/auth/init-mobile-reg", {
      onSuccess: (data) => {
        if (data.alreadyVerified) {
          setState(prev => ({ ...prev, step: 3 }));
          sileo.success({ title: "Already Verified", description: "Mobile recently verified, skip to details." });
        } else {
          setState(prev => ({ ...prev, step: 2, countdown: data.expiresIn }));
          sileo.success({ title: "OTP Sent", description: data.message });
        }
      },
      onError: (error) => {
        sileo.error({ title: "Error", description: error.message });
      }
    })
  );

  const verifyMobileMutation = useMutation<VerifyMobileResponse, Error, { mobile: string; otp: string }>(
    http.post<VerifyMobileResponse, { mobile: string; otp: string }>("/auth/verify-mobile-reg", {
      onSuccess: (data) => {
        setState(prev => ({ ...prev, verificationToken: data.verificationToken, step: 3 }));
        sileo.success({ title: "Verified", description: data.message });
      },
      onError: (error) => {
        sileo.error({ title: "Verification Failed", description: error.message });
      }
    })
  );

  const completeRegMutation = useMutation<CompleteRegResponse, Error, any>(
    http.post<CompleteRegResponse, any>("/auth/complete-reg", {
      onSuccess: (data) => {
        setToken(data.token);
        setUser(data.user);
        sileo.success({ title: "Welcome!", description: "Account created successfully." });
        router.push("/dashboard");
      },
      onError: (error) => {
        sileo.error({ title: "Registration Failed", description: error.message });
      }
    })
  );

  const checkMobileExists = async (mobile: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/check-mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await response.json();
      return data.exists === true;
    } catch (error) {
      console.error('Error checking mobile:', error);
      return false;
    }
  };

  // Forms
  const mobileForm = useForm<MobileRegFormData>({
    resolver: zodResolver(mobileRegSchema),
    defaultValues: { mobile: "" },
  });

  const otpForm = useForm<OtpRegFormData>({
    resolver: zodResolver(otpRegSchema),
    defaultValues: { otp: "" },
  });

  const detailsForm = useForm<DetailsRegFormData>({
    resolver: zodResolver(detailsRegSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      referred_by: "",
      terms_accepted: false,
    },
  });

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      detailsForm.setValue("referred_by", refCode);
    }
  }, [searchParams, detailsForm]);

  useEffect(() => {
    if (state.countdown > 0) {
      const timer = setTimeout(() => setState(prev => ({ ...prev, countdown: prev.countdown - 1 })), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.countdown]);

  // Handlers
  const onMobileSubmit = async (values: MobileRegFormData) => {
    const mobileExists = await checkMobileExists(values.mobile);
    if (mobileExists) {
      sileo.error({ title: "Mobile Number Exists", description: "A user with this mobile number already exists. Please login instead." });
      return;
    }

    setState(prev => ({ ...prev, mobile: values.mobile }));
    
    if (firebaseOtp.isConfigValid) {
      const result = await firebaseOtp.sendOtp(values.mobile);
      if (result.success) {
        setState(prev => ({ ...prev, step: 2, countdown: 60 }));
        sileo.success({ title: "OTP Sent", description: `OTP sent to +91 ${values.mobile}` });
      } else {
        sileo.error({ title: "Error", description: result.error || "Failed to send OTP" });
      }
    } else {
      initMobileMutation.mutate(values);
    }
  };

  const onOtpSubmit = async (values: OtpRegFormData) => {
    if (firebaseOtp.isConfigValid && firebaseOtp.verificationId) {
      const result = await firebaseOtp.verifyOtp(values.otp);
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          verificationToken: result.verificationId!, 
          firebaseIdToken: result.idToken!,
          step: 3 
        }));
        sileo.success({ title: "Verified", description: "Mobile number verified successfully" });
      } else {
        sileo.error({ title: "Verification Failed", description: result.error || "Invalid OTP" });
      }
    } else {
      verifyMobileMutation.mutate({ mobile: state.mobile, otp: values.otp });
    }
  };

  const onDetailsSubmit = (values: DetailsRegFormData) => {
    const token = firebaseOtp.isConfigValid && state.firebaseIdToken 
      ? state.firebaseIdToken 
      : (state.verificationToken || "skipped_verification");
    
    completeRegMutation.mutate({
      verificationToken: token,
      mobile: state.mobile,
      ...values,
      terms_accepted: 'true'
    });
  };

  const handleResendOtp = async () => {
    if (state.countdown > 0) return;
    
    if (firebaseOtp.isConfigValid) {
      const result = await firebaseOtp.sendOtp(state.mobile);
      if (result.success) {
        setState(prev => ({ ...prev, countdown: 60 }));
        sileo.success({ title: "OTP Sent", description: `OTP resent to +91 ${state.mobile}` });
      } else {
        sileo.error({ title: "Error", description: result.error || "Failed to send OTP" });
      }
    } else {
      initMobileMutation.mutate({ mobile: state.mobile });
    }
  };

  const stepTitles = {
    1: "Sign Up with Mobile",
    2: "Verify Mobile Number",
    3: "Complete Profile"
  };

  const stepDescriptions = {
    1: "Enter your mobile number to get started.",
    2: `Enter the OTP sent to +91 ${state.mobile}`,
    3: "Set up your account details."
  };

  return (
    <Card className="w-full max-w-sm border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl  tracking-tight">{stepTitles[state.step]}</CardTitle>
        <CardDescription>{stepDescriptions[state.step]}</CardDescription>
        {!firebaseOtp.isConfigValid && state.step === 1 && (
          <p className="text-xs text-amber-500 mt-2">
            Firebase not configured. Using fallback OTP.
          </p>
        )}
      </CardHeader>

      {state.step === 1 && (
        <form onSubmit={mobileForm.handleSubmit(onMobileSubmit)}>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="signup-mobile">Mobile Number</FieldLabel>
              <div className="flex mb-8">
                <span className="inline-flex items-center px-3 rounded-l-full  border border-r-0 bg-muted text-muted-foreground text-sm">
                  +91
                </span>
                <Input
                  id="signup-mobile"
                  className="rounded-l-none"
                  placeholder="9876543210"
                  maxLength={10}
                  {...mobileForm.register("mobile")}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    mobileForm.setValue("mobile", value);
                  }}
                />
              </div>
              {mobileForm.formState.errors.mobile && (
                <FieldError>{mobileForm.formState.errors.mobile.message}</FieldError>
              )}
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={initMobileMutation.isPending || firebaseOtp.loading}>
              {(initMobileMutation.isPending || firebaseOtp.loading) ? (
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" />
              ) : null}
              {initMobileMutation.isPending || firebaseOtp.loading ? "Sending OTP..." : "Get OTP"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="underline font-medium text-primary">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      )}

      {state.step === 2 && (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
          <CardContent className="space-y-4">
            <Field>

              <div className="flex justify-between">
                <FieldLabel htmlFor="signup-otp">Enter 6-digit OTP</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setState(prev => ({ ...prev, step: 1 }))}
                >
                  <HugeiconsIcon icon={Edit03Icon} className="w-5 h-5" />
                </Button>
              </div>
              <Input
                id="signup-otp"
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest "
                {...otpForm.register("otp")}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  otpForm.setValue("otp", value);
                }}
              />
              {otpForm.formState.errors.otp && (
                <FieldError>{otpForm.formState.errors.otp.message}</FieldError>
              )}
              {firebaseOtp.error && firebaseOtp.isConfigValid && (
                <FieldError>{firebaseOtp.error}</FieldError>
              )}
            </Field>
            <div className="text-center mb-4">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={handleResendOtp}
                disabled={state.countdown > 0 || initMobileMutation.isPending || firebaseOtp.loading}
              >
                {state.countdown > 0 ? `Resend OTP in ${state.countdown}s` : "Resend OTP"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={verifyMobileMutation.isPending || firebaseOtp.loading}>
              {verifyMobileMutation.isPending || firebaseOtp.loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </CardFooter>
        </form>
      )}

      {state.step === 3 && (
        <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)}>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="signup-name">Full Name</FieldLabel>
              <Input id="signup-name" placeholder="Gaurav Chaudhary" {...detailsForm.register("name")} />
              {detailsForm.formState.errors.name && (
                <FieldError>{detailsForm.formState.errors.name.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-email">Email Address</FieldLabel>
              <Input id="signup-email" placeholder="hello@example.com" type="email" {...detailsForm.register("email")} />
              <p className="text-[10px] text-muted-foreground mt-1">
                Your email will be linked to +91 {state.mobile}
              </p>
              {detailsForm.formState.errors.email && (
                <FieldError>{detailsForm.formState.errors.email.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input id="signup-password" type="password" {...detailsForm.register("password")} />
              {detailsForm.formState.errors.password && (
                <FieldError>{detailsForm.formState.errors.password.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-confirm-password">Confirm Password</FieldLabel>
              <Input id="signup-confirm-password" type="password" {...detailsForm.register("confirmPassword")} />
              {detailsForm.formState.errors.confirmPassword && (
                <FieldError>{detailsForm.formState.errors.confirmPassword.message}</FieldError>
              )}
            </Field>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={detailsForm.watch("terms_accepted")}
                onCheckedChange={(checked) => detailsForm.setValue("terms_accepted", checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I accept the Digital Agreement
                </Label>
                <p className="text-xs text-muted-foreground">
                  By clicking continue, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
            {detailsForm.formState.errors.terms_accepted && (
              <FieldError>{detailsForm.formState.errors.terms_accepted.message}</FieldError>
            )}

            <input type="hidden" {...detailsForm.register("referred_by")} />
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={completeRegMutation.isPending}>
              {completeRegMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </CardFooter>
        </form>
      )}
      
      <div id="recaptcha-container" />
    </Card>
  );
}
