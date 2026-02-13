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
  ShippingTruck01Icon
} from "@hugeicons/core-free-icons"

const data = {
  user: {
    name: "Gaurav Chaudhary",
    email: "gaurav@gmail.com",
  },
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
      title: "Franchaise",
      url: "/dashboard/franchaise",
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
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <HugeiconsIcon icon={ShippingTruck01Icon} strokeWidth={2} className="size-5!" />
              <span className="text-base font-semibold">Cheap Ship</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
