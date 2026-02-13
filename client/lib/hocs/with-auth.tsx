"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithAuth: React.FC<P> = (props) => {
    const { token } = useAuth();
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
      // Simulate checking if the store has been hydrated
      // Since we can't reliably check hydration status, we'll use a minimal timeout
      const timer = setTimeout(() => {
        setIsChecking(false);
      }, 50); // Very short timeout to allow for potential hydration

      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      if (!isChecking && !token) {
        router.replace("/auth/signin");
      }
    }, [token, isChecking, router]);

    // Only redirect if we're done checking and user is not authenticated
    // During the checking phase, we render the wrapped component which can handle its own loading state
    if (!isChecking && !token) {
      return null; // The effect will handle the redirect
    }

    // Render the wrapped component - it can handle its own loading state
    // This allows the actual page to show its own skeleton loaders
    return <WrappedComponent {...props} />;
  };

  return WithAuth;
}
