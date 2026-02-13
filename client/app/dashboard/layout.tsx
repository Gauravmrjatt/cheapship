"use client"
import withAuth from "@/lib/hocs/with-auth";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation";

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(segment => segment !== '');
  if (segments.length === 0) {
    return "Dashboard"; // Default title for the base dashboard
  }
  const lastSegment = segments[segments.length - 1];
  // Replace hyphens with spaces and capitalize each word
  return lastSegment.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader pageTitle={pageTitle} />
        {children}
      </SidebarInset>
    </SidebarProvider>

  );
}

export default withAuth(DashboardLayout);