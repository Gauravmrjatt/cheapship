"use client";

import { WifiOff } from "lucide-react";

interface OfflineBannerProps {
  show: boolean;
}

export function OfflineBanner({ show }: OfflineBannerProps) {
  if (!show) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <WifiOff className="h-4 w-4" />
      <span>No internet connection</span>
    </div>
  );
}