"use client";
import { KBarProvider } from "kbar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useKbarActions } from "@/hooks/use-kbar-actions"
import { adminNav, data } from "@/components/app-sidebar"
import { useAuth } from "@/lib/hooks/use-auth"
const extra = [
  {
    id: "logout",
    name: "Logout",
    shortcut: ["Mod+L"],
    action: () => {
      useAuth().logout();
    },
  },
]
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const { user } = useAuth();
  const actions = useKbarActions({
    userType: user?.user_type,
    adminNav,
    navMain: data.navMain,
    navSecondary: data.navSecondary,
    documents: data.documents,
  })
  return (
    <KBarProvider actions={actions}>
      <QueryClientProvider client={queryClient}>
        {children}</QueryClientProvider>
    </KBarProvider>
  );
}