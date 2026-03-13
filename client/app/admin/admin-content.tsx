"use client";

import { useAdminDashboard, useNetworkCommissionStats } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserGroupIcon, 
  ShoppingBasket01Icon, 
  MoneyReceiveCircleIcon, 
  Invoice01Icon,
  ArrowRight01Icon,
  AiNetworkIcon,
  Money03Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  PackageIcon,
  TruckIcon,
  DeliveryBox01Icon,
  BarChartIcon,
  Cancel01Icon,
  Alert02Icon,
  Time04Icon,
  PercentIcon,
  ChartUpIcon,
  ChartDownIcon,
  CustomerService02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { ChartPie } from "@/components/chart-pie";
import { ChartBar } from "@/components/chart-bar";
import { ChartDonut } from "@/components/chart-donut";
import { ChartLine } from "@/components/chart-line";
import { ChartRadar } from "@/components/chart-radar";
import { ChartHorizontal } from "@/components/chart-horizontal";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { DashboardStats } from "@/lib/hooks/use-admin";

// Order Status Cards Component
function OrderStatusCards({ data, isLoading }: { data: DashboardStats | undefined; isLoading: boolean }) {
  const router = useRouter();

  const cards = [
    { label: "Delivered", value: data?.deliveredOrders, icon: DeliveryBox01Icon, color: "text-green-600", bg: "bg-green-100", status: "DELIVERED" },
    { label: "In Transit", value: data?.inTransitOrders, icon: TruckIcon, color: "text-blue-600", bg: "bg-blue-100", status: "IN_TRANSIT" },
    { label: "Dispatched", value: data?.dispatchedOrders, icon: PackageIcon, color: "text-purple-600", bg: "bg-purple-100", status: "DISPATCHED" },
    { label: "Manifested", value: data?.manifestedOrders, icon: BarChartIcon, color: "text-orange-600", bg: "bg-orange-100", status: "MANIFESTED" },
    { label: "RTO", value: data?.rtoOrders, icon: Cancel01Icon, color: "text-red-600", bg: "bg-red-100", status: "RTO" },
    { label: "Pending", value: data?.pendingOrders, icon: Clock01Icon, color: "text-amber-600", bg: "bg-amber-100", status: "PENDING" },
    { label: "Not Picked", value: data?.notPickedOrders, icon: Alert02Icon, color: "text-gray-600", bg: "bg-gray-100", status: "NOT_PICKED" },
    { label: "Cancelled", value: data?.cancelledOrders, icon: Cancel01Icon, color: "text-rose-600", bg: "bg-rose-100", status: "CANCELLED" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-8 w-8 rounded-lg mb-3" />
              <Skeleton className="h-6 w-12 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.label} 
          className="rounded-2xl border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/admin/orders?shipment_status=${card.status}`)}
        >
          <CardContent className="p-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", card.bg)}>
              <HugeiconsIcon icon={card.icon} size={20} className={card.color} />
            </div>
            <div className="text-2xl font-bold">{card.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Metrics Cards Component
function MetricsCards({ data, isLoading }: { data: DashboardStats | undefined; isLoading: boolean }) {
  const cards = [
    { label: "Total Orders", value: data?.totalOrders, icon: PackageIcon, footer: "All time orders" },
    { label: "Avg Delivery Time", value: data?.avgDeliveryTime, icon: Time04Icon, footer: "Average performance" },
    { label: "Success Rate", value: data?.deliverySuccessRate, icon: PercentIcon, footer: "Delivery success" },
    { label: "Return Rate", value: data?.returnRate, icon: ChartDownIcon, footer: "RTO percentage" },
    { label: "Weight Shipped", value: data?.totalWeightShipped, icon: BarChartIcon, footer: "Total weight" },
    { label: "Monthly Growth", value: data?.monthlyGrowth, icon: ChartUpIcon, footer: "vs last month" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <HugeiconsIcon icon={card.icon} size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <div className="text-xl font-bold">{card.value ?? "-"}</div>
            <p className="text-xs text-muted-foreground">{card.footer}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Dispute Cards Component
function DisputeCards({ data, isLoading }: { data: DashboardStats | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  
  {/* Weight Disputes */}
  <Card className="rounded-2xl border border-amber-200 dark:border-amber-800 
                   bg-amber-50 dark:bg-amber-900/20 
                   hover:shadow-md transition-all duration-200">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <HugeiconsIcon icon={Alert02Icon} size={18} className="text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Weight Disputes
        </span>
      </div>

      <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
        {data?.weightDisputeOrders ?? 0}
      </div>

      <p className="text-xs mt-1 text-amber-700/80 dark:text-amber-300/70">
        Pending review from logistics
      </p>
    </CardContent>
  </Card>

  {/* RTO Disputes */}
  <Card className="rounded-2xl border border-red-200 dark:border-red-800 
                   bg-red-50 dark:bg-red-900/20 
                   hover:shadow-md transition-all duration-200">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <HugeiconsIcon icon={Cancel01Icon} size={18} className="text-red-600 dark:text-red-400" />
        <span className="text-sm font-semibold text-red-800 dark:text-red-300">
          RTO Disputes
        </span>
      </div>

      <div className="text-3xl font-bold text-red-900 dark:text-red-100">
        {data?.rtoDisputeOrders ?? 0}
      </div>

      <p className="text-xs mt-1 text-red-700/80 dark:text-red-300/70">
        Requires immediate attention
      </p>
    </CardContent>
  </Card>

  {/* Action Required */}
  <Card className="rounded-2xl border border-blue-200 dark:border-blue-800 
                   bg-blue-50 dark:bg-blue-900/20 
                   hover:shadow-md transition-all duration-200">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <HugeiconsIcon icon={CustomerService02Icon} size={18} className="text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
          Action Required
        </span>
      </div>

      <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
        {data?.actionRequired ?? 0}
      </div>

      <p className="text-xs mt-1 text-blue-700/80 dark:text-blue-300/70">
        Total pending operational tasks
      </p>
    </CardContent>
  </Card>

</div>
  );
}

// Main Overview Cards (Original)
function OverviewCards({ data, isLoading }: { data: DashboardStats | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="rounded-2xl border-none shadow-sm ">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <HugeiconsIcon icon={UserGroupIcon} size={16} className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data?.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {data?.activeUsers} active now
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-none shadow-sm ">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <HugeiconsIcon icon={ShoppingBasket01Icon} size={16} className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data?.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            All time
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-none shadow-sm ">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <HugeiconsIcon icon={Invoice01Icon} size={16} className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{Number(data?.totalRevenue).toLocaleString("en-IN")}</div>
          <p className="text-xs text-muted-foreground">
            Gross shipping charges
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-none shadow-sm ">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
          <HugeiconsIcon icon={MoneyReceiveCircleIcon} size={16} className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data?.pendingWithdrawals}</div>
          <p className="text-xs text-muted-foreground">
            Requests to approve
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Network Commission Card
function NetworkCommissionCard({ data, isLoading }: { data: { total_commission: number; withdrawn_commission: number; pending_commission: number; total_count: number; } | undefined; isLoading: boolean }) {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={AiNetworkIcon} size={20} className="text-primary" />
          <CardTitle className="text-lg">Network Commissions</CardTitle>
        </div>
        <CardDescription>
          Overview of multi-level referral commission payouts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HugeiconsIcon icon={Money03Icon} size={16} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Commissions</span>
                </div>
                <div className="text-2xl font-bold">
                  ₹{Number(data?.total_commission || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-green-500" />
                  <span className="text-xs text-muted-foreground">Withdrawn</span>
                </div>
                <div className="text-2xl font-bold">
                  ₹{Number(data?.withdrawn_commission || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HugeiconsIcon icon={Clock01Icon} size={16} className="text-orange-500" />
                  <span className="text-xs text-muted-foreground">Pending Withdrawal</span>
                </div>
                <div className="text-2xl font-bold">
                  ₹{Number(data?.pending_commission || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-xs text-muted-foreground">
                {data?.total_count || 0} commission records total
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Recent Orders Card
function RecentOrdersCard({ data, isLoading }: { data: DashboardStats | undefined; isLoading: boolean }) {
  return (
    <Card className="lg:col-span-4 rounded-2xl border-none shadow-sm">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>
          Latest transactions across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 bg-muted/30 rounded-xl">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.recentOrders?.map((order) => (
              <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-4 bg-muted/30 rounded-xl">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs font-bold">#{order.id.toString().slice(0,8)}</span>
                  <span className="text-xs text-muted-foreground">{order.user?.name}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <Badge variant="outline" className="text-[10px]">{order.shipment_status}</Badge>
                  <span className="text-sm font-bold">₹{order.total_amount}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-center pt-4">
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All Orders <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Actions Card
function QuickActionsCard({ data, isLoading }: { data: DashboardStats | undefined; isLoading: boolean }) {
  return (
    <Card className="lg:col-span-3 rounded-2xl border-none shadow-sm">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/admin/withdrawals">
          <Button variant="outline" className="w-full justify-start h-12 rounded-xl">
            <HugeiconsIcon icon={MoneyReceiveCircleIcon} className="mr-2 size-5" />
            Process Withdrawals
            {!isLoading && data?.pendingWithdrawals && data.pendingWithdrawals > 0 && (
              <Badge className="ml-auto bg-primary text-primary-foreground">{data.pendingWithdrawals}</Badge>
            )}
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="outline" className="w-full justify-start h-12 rounded-xl">
            <HugeiconsIcon icon={UserGroupIcon} className="mr-2 size-5" />
            Manage Users
          </Button>
        </Link>
        <Link href="/admin/transactions">
          <Button variant="outline" className="w-full justify-start h-12 rounded-xl">
            <HugeiconsIcon icon={Invoice01Icon} className="mr-2 size-5" />
            View Transactions
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();
  const { data: commissionStats, isLoading: commissionLoading } = useNetworkCommissionStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Basic Overview Cards */}
      <OverviewCards data={data} isLoading={isLoading} />

      {/* Order Status Cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Order Status Overview</h3>
        <OrderStatusCards data={data} isLoading={isLoading} />
      </div>

      {/* Metrics Cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Platform Metrics</h3>
        <MetricsCards data={data} isLoading={isLoading} />
      </div>

      {/* Dispute Cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Pending Disputes</h3>
        <DisputeCards data={data} isLoading={isLoading} />
      </div>

      {/* Chart Section - Full Width Area Chart */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Orders Overview (Last 30 Days)</CardTitle>
          <CardDescription>Daily order trends across all users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <ChartAreaInteractive data={data?.graphData} />
          )}
        </CardContent>
      </Card>

      {/* Additional Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pie Chart - Order Status Distribution */}
        <ChartPie 
          isLoading={isLoading} 
          data={data} 
        />

        {/* Donut Chart - Revenue Breakdown */}
        <ChartDonut 
          isLoading={isLoading} 
          totalRevenue={data?.totalRevenue || 0}
        />

        {/* Bar Chart - Orders vs Revenue */}
        <ChartBar 
          isLoading={isLoading} 
          data={data?.graphData} 
        />

        {/* Line Chart - Order Trends */}
        <ChartLine 
          isLoading={isLoading} 
          data={data?.graphData} 
        />

        {/* Radar Chart - Performance Metrics */}
        <ChartRadar 
          isLoading={isLoading} 
          data={data} 
        />

        {/* Horizontal Bar Chart - Top Couriers/Users */}
        <ChartHorizontal 
          isLoading={isLoading} 
          topCouriers={data?.topCouriers}
          topUsers={data?.topUsers}
        />
      </div>

      {/* Network Commission Card */}
      <NetworkCommissionCard data={commissionStats} isLoading={commissionLoading} />

      {/* Recent Orders & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-7">
        <RecentOrdersCard data={data} isLoading={isLoading} />
        <QuickActionsCard data={data} isLoading={isLoading} />
      </div>
    </div>
  );
}
