"use client";

import { useAdminDashboard } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserGroupIcon, 
  ShoppingBasket01Icon, 
  MoneyReceiveCircleIcon, 
  Invoice01Icon,
  ArrowRight01Icon
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/components/orders-data-table";

export default function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

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
    <div className="space-y-8 animate-in fade-in duration-500">
   
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

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest transactions across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
{data?.recentOrders?.map((order: any) => (
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
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/admin/withdrawals">
              <Button variant="outline" className="w-full justify-start h-12 rounded-xl">
                <HugeiconsIcon icon={MoneyReceiveCircleIcon} className="mr-2 size-5" />
                Process Withdrawals
                {data?.pendingWithdrawals > 0 && (
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
      </div>
    </div>
  );
}
