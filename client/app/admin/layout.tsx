"use client";

import withAuth from "@/lib/hocs/with-auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { Skeleton } from "@/components/ui/skeleton";

function AdminLayoutLoading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar Skeleton */}
      <div className="w-[288px] bg-muted/30 border-r p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b px-6 flex items-center">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.user_type !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <AdminLayoutLoading />;
  }

  if (user?.user_type !== 'ADMIN') {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" isAdmin={true} />
      <SidebarInset>
        <SiteHeader pageTitle="Admin Panel" />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default withAuth(AdminLayout);
