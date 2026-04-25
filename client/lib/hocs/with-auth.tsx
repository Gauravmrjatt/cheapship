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
    // Show a loading state during the redirect to ensure FCP
    if (!isChecking && !token) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Skeleton className="h-12 w-12 rounded-full animate-spin border-4 border-primary border-t-transparent" />
        </div>
      );
    }

    // Render the wrapped component - it can handle its own loading state
    // This allows the actual page to show its own skeleton loaders
    return <WrappedComponent {...props} />;
  };

  return WithAuth;
}
