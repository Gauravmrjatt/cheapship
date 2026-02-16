"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  ShoppingBasket01Icon,
  Add01Icon,
  Calculator01Icon,
  Invoice01Icon,
  CreditCardIcon,
  UserGroupIcon,
  WeightScale01Icon,
  RotateLeft01Icon,
  Settings05Icon,
  HelpCircleIcon,
  SearchIcon,
  ShippingTruck01Icon,
  AddressBookIcon,
  UserCircle02Icon,
  MoneyReceiveCircleIcon,
  Globe02Icon
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/lib/hooks/use-auth"

const adminNav = [
  {
    title: "Overview",
    url: "/admin",
    icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
  },
  {
    title: "All Orders",
    url: "/admin/orders",
    icon: <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} />,
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
  },
  {
    title: "Finance & Withdrawals",
    url: "/admin/withdrawals",
    icon: <HugeiconsIcon icon={MoneyReceiveCircleIcon} strokeWidth={2} />,
  },
  {
    title: "Global Settings",
    url: "/admin/settings",
    icon: <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />,
  },
];

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: (
        <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Create Order",
      url: "/dashboard/orders/new",
      icon: (
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Calculator",
      url: "/dashboard/calculator",
      icon: (
        <HugeiconsIcon icon={Calculator01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Address Book",
      url: "/dashboard/addresses",
      icon: (
        <HugeiconsIcon icon={AddressBookIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Invoices",
      url: "/dashboard/invoices",
      icon: (
        <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Payments",
      url: "/dashboard/payments",
      icon: (
        <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Franchise",
      url: "/dashboard/franchise",
      icon: (
        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
      ),
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Get Help",
      url: "/dashboard/help",
      icon: (
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
      ),
    },
  ],
  documents: [
    {
      name: "Weight Mismatch",
      url: "/dashboard/weight-mismatch",
      icon: (
        <HugeiconsIcon icon={WeightScale01Icon} strokeWidth={2} />
      ),
    },
    {
      name: "RTO",
      url: "/dashboard/rto",
      icon: (
        <HugeiconsIcon icon={RotateLeft01Icon} strokeWidth={2} />
      ),
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin, ...props }: AppSidebarProps) {
  const { user } = useAuth();
  const displayUser = {
    name: user?.name || "User",
    email: user?.email || "",
  }

  const mainNavItems = user?.user_type === "ADMIN" ? [...adminNav, ...data.navMain] : data.navMain;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href={isAdmin ? "/admin" : "/dashboard"} />}
            >
              <HugeiconsIcon icon={ShippingTruck01Icon} strokeWidth={2} className="size-5!" />
              <span className="text-base font-semibold">{user?.user_type === "ADMIN"  ? "Admin Panel" : "Cheap Ship"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNavItems} />
        {!isAdmin && <NavDocuments items={data.documents} />}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
