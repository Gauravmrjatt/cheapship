"use client";

import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
};

const getFirebaseApp = () => {
  if (typeof window === "undefined") return null;
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

interface UseFirebaseOtpReturn {
  sendOtp: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string; verificationId?: string; idToken?: string }>;
  verificationId: string | null;
  loading: boolean;
  error: string | null;
  isConfigValid: boolean;
}

export function useFirebaseOtp(): UseFirebaseOtpReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const authRef = useRef<ReturnType<typeof getAuth> | null>(null);

  const isConfigValid = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.vapidKey &&
    firebaseConfig.apiKey !== "your_api_key"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isConfigValid) return;

    const app = getFirebaseApp();
    if (!app) return;

    const auth = getAuth(app);
    authRef.current = auth;

    if (!recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            console.log("Recaptcha verified");
          },
          "expired-callback": () => {
            setError("Recaptcha expired. Please try again.");
          },
        });
        setRecaptchaVerifier(verifier);
      } catch (err) {
        console.error("Failed to create RecaptchaVerifier:", err);
      }
    }

    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [isConfigValid]);

  const sendOtp = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigValid) {
      return { success: false, error: "Firebase not configured. Please add Firebase credentials to .env" };
    }

    if (!authRef.current || !recaptchaVerifier) {
      return { success: false, error: "Firebase not initialized" };
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      
      const confirmationResult = await signInWithPhoneNumber(
        authRef.current,
        formattedPhone,
        recaptchaVerifier
      );

      setVerificationId(confirmationResult.verificationId);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || "Failed to send OTP";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const verifyOtp = async (otp: string): Promise<{ success: boolean; error?: string; verificationId?: string; idToken?: string }> => {
    if (!verificationId) {
      return { success: false, error: "No verification ID found. Please request OTP first." };
    }

    setLoading(true);
    setError(null);

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(authRef.current!, credential);
      
      const idToken = await result.user.getIdToken();
      
      setLoading(false);
      return { 
        success: true, 
        verificationId: result.user.uid,
        idToken: idToken 
      };
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || "Invalid OTP";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    sendOtp,
    verifyOtp,
    verificationId,
    loading,
    error,
    isConfigValid,
  };
}
