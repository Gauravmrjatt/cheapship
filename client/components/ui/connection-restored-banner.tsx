"use client";

import { useEffect, useState } from "react";
import { Wifi } from "lucide-react";

interface ConnectionRestoredBannerProps {
  show: boolean;
}

export function ConnectionRestoredBanner({ show }: ConnectionRestoredBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-md animate-in slide-in-from-top duration-300"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Wifi className="h-4 w-4" />
      <span>Connection restored</span>
    </div>
  );
}