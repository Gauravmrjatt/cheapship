import { z } from "zod";

export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signInOtpSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().min(10, "Mobile number must be at least 10 characters").optional().or(z.literal("")),
}).refine((data) => data.email || data.mobile, {
  message: "Either email or mobile is required",
  path: ["email"],
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
    mobile: z.string().min(10, "Mobile number must be at least 10 characters"),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    referred_by: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
