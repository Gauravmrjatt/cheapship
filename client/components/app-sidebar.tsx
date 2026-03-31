"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

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
  useSidebar,
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
  Globe02Icon,
  Wallet01Icon,
  Comment01Icon,
  DeliveryReturnIcon,
  CustomerService02Icon
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const adminNav = [
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
    title: "KYC Verification",
    url: "/admin/kyc",
    icon: <HugeiconsIcon icon={UserCircle02Icon} strokeWidth={2} />,
  },
  {
    title: "All Orders",
    url: "/admin/orders",
    icon: <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} />,
  },
  {
    title: "COD Orders",
    url: "/admin/cod-orders",
    icon: <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} />,
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
  },
  {
    title: "Weight Disputes",
    url: "/admin/weight-disputes",
    icon: <HugeiconsIcon icon={WeightScale01Icon} strokeWidth={2} />,
  },
  {
    title: "RTO",
    url: "/admin/rto",
    icon: <HugeiconsIcon icon={DeliveryReturnIcon} strokeWidth={2} />,
  },
  {
    title: "Support Tickets",
    url: "/admin/support-tickets",
    icon: <HugeiconsIcon icon={CustomerService02Icon} strokeWidth={2} />,
  },
  {
    title: "Feedback",
    url: "/admin/feedback",
    icon: <HugeiconsIcon icon={Comment01Icon} strokeWidth={2} />,
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

export const data = {
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
      title: "COD & Remittance",
      url: "/dashboard/remittances",
      icon: (
        <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} />
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
      title: "Search Orders",
      url: "/dashboard/orders?search=1",
      icon: (
        <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
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
      title: "Feedback",
      url: "/dashboard/feedback",
      icon: (
        <HugeiconsIcon icon={Comment01Icon} strokeWidth={2} />
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
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [showSearchDialog, setShowSearchDialog] = React.useState(false);
  const [sidebarSearch, setSidebarSearch] = React.useState("");

  const displayUser = {
    name: user?.name || "User",
    email: user?.email || "",
  }

  const mainNavItems = user?.user_type === "ADMIN" ? [...adminNav, ...data.navMain] : data.navMain;

  const handleSearchSubmit = () => {
    if (sidebarSearch.trim()) {
      router.push(`/dashboard/orders?search=1&q=${encodeURIComponent(sidebarSearch.trim())}`);
      setShowSearchDialog(false);
      setSidebarSearch("");
    }
  };

  const modifiedNavSecondary = data.navSecondary.map(item =>
    item.title === "Search Orders"
      ? { ...item, url: "#", onClick: () => setShowSearchDialog(true) }
      : item
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              onClick={() => isMobile && setOpenMobile(false)}
              render={<a href={isAdmin ? "/admin" : "/dashboard"} />}
            >
              <HugeiconsIcon icon={ShippingTruck01Icon} strokeWidth={2} className="size-5!" />
              <span className="text-base font-semibold">{user?.user_type === "ADMIN" ? "Admin Panel" : "Cheap Ship"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNavItems} />
        <NavDocuments items={data.documents} />

        <NavSecondary
          items={modifiedNavSecondary}
          className="mt-auto"
          onItemClick={(title: string) => {
            if (title === "Search Orders") {
              setShowSearchDialog(true);
            }
          }}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Orders</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="relative">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, shipment ID, tracking number..."
                className="pl-10"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSearchDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSearchSubmit}>
                Search
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
