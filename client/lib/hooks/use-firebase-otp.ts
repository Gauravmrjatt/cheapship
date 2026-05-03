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

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaContainerExists?: boolean;
  }
}

interface UseFirebaseOtpReturn {
  sendOtp: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string; verificationId?: string; idToken?: string }>;
  verificationId: string | null;
  loading: boolean;
  error: string | null;
  isConfigValid: boolean;
  isVerifierReady: boolean;
}

export function useFirebaseOtp(): UseFirebaseOtpReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isVerifierReady, setIsVerifierReady] = useState(false);
  const authRef = useRef<ReturnType<typeof getAuth> | null>(null);
  const isMountedRef = useRef(true);

  const isConfigValid = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.vapidKey &&
    firebaseConfig.apiKey !== "your_api_key"
  );

  const initializeRecaptcha = (auth: ReturnType<typeof getAuth>) => {
    const container = document.getElementById("recaptcha-container");
    if (!container) {
      console.warn("Recaptcha container not found, retrying...");
      setTimeout(() => {
        if (document.getElementById("recaptcha-container")) {
          initializeRecaptcha(auth);
        }
      }, 500);
      return;
    }

    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined;
    }

    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("Recaptcha verified");
        },
        "expired-callback": () => {
          setError("Recaptcha expired. Please try again.");
          setIsVerifierReady(false);
        },
        "error-callback": (error: string) => {
          console.error("Recaptcha error:", error);
          setError("reCAPTCHA error. Please try again.");
          setIsVerifierReady(false);
        },
      });

      window.recaptchaVerifier = verifier;
      window.recaptchaContainerExists = true;
      
      verifier.render().then(() => {
        console.log("reCAPTCHA ready");
        setIsVerifierReady(true);
        setError(null);
      }).catch((err) => {
        console.error("Recaptcha render error:", err);
        setError("reCAPTCHA failed to load. Please refresh the page.");
        setIsVerifierReady(false);
      });
    } catch (err) {
      console.error("Failed to create RecaptchaVerifier:", err);
      setError("reCAPTCHA initialization failed. Please refresh and try again.");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isConfigValid) return;

    const app = getFirebaseApp();
    if (!app) return;

    const auth = getAuth(app);
    authRef.current = auth;

    if (!window.recaptchaVerifier || !window.recaptchaContainerExists) {
      initializeRecaptcha(auth);
    } else {
      setIsVerifierReady(true);
    }
  }, [isConfigValid]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const sendOtp = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigValid) {
      return { success: false, error: "Firebase not configured. Please add Firebase credentials to .env" };
    }

    if (!authRef.current) {
      return { success: false, error: "Firebase not initialized. Please refresh and try again." };
    }

    if (!window.recaptchaVerifier || !window.recaptchaContainerExists) {
      console.log("Reinitializing reCAPTCHA...");
      initializeRecaptcha(authRef.current);
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!window.recaptchaVerifier) {
        return { success: false, error: "reCAPTCHA failed to initialize. Please try again." };
      }
    }

    isMountedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;

      const confirmationResult = await signInWithPhoneNumber(
        authRef.current,
        formattedPhone,
        window.recaptchaVerifier
      );

      if (!isMountedRef.current) return { success: false, error: "Component unmounted" };

      setVerificationId(confirmationResult.verificationId);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      if (!isMountedRef.current) return { success: false, error: "Component unmounted" };
      setLoading(false);
      
      let errorMessage = err.message || "Failed to send OTP";
      
      if (errorMessage.includes("reCAPTCHA") || errorMessage.includes("recaptcha")) {
        console.log("Recaptcha error detected, reinitializing...");
        window.recaptchaVerifier = undefined;
        window.recaptchaContainerExists = false;
        initializeRecaptcha(authRef.current);
        errorMessage = "reCAPTCHA expired. Please try again.";
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const verifyOtp = async (otp: string): Promise<{ success: boolean; error?: string; verificationId?: string; idToken?: string }> => {
    if (!verificationId) {
      return { success: false, error: "No verification ID found. Please request OTP first." };
    }

    if (!authRef.current) {
      return { success: false, error: "Firebase not initialized. Please refresh and try again." };
    }

    isMountedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(authRef.current, credential);

      const idToken = await result.user.getIdToken();

      if (!isMountedRef.current) return { success: false, error: "Component unmounted" };

      setLoading(false);
      return {
        success: true,
        verificationId: result.user.uid,
        idToken: idToken
      };
    } catch (err: any) {
      if (!isMountedRef.current) return { success: false, error: "Component unmounted" };
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
    isVerifierReady,
  };
}
