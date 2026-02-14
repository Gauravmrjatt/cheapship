"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import {
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
} from "@hugeicons/core-free-icons"
import { DashboardData } from "@/types/dashboard"

export function SectionCards({
  data,
}: {
  data: DashboardData
}) {
  const cards = [
    {
      label: "Delivered Orders",
      value: data?.deliveredOrders,
      icon: DeliveryBox01Icon,
      footer: "Successfully delivered shipments",
      trend: "up",
    },
    {
      label: "In Transit Orders",
      value: data?.inTransitOrders,
      icon: TruckIcon,
      footer: "Orders currently on the way",
      trend: "up",
    },
    {
      label: "Dispatched Orders",
      value: data?.dispatchedOrders,
      icon: PackageIcon,
      footer: "Orders shipped from warehouse",
      trend: "up",
    },
    {
      label: "Manifested Orders",
      value: data?.manifestedOrders,
      icon: BarChartIcon,
      footer: "Orders processed & manifested",
      trend: "up",
    },
    {
      label: "RTO Orders",
      value: data?.rtoOrders,
      icon: Cancel01Icon,
      footer: "Returned to origin shipments",
      trend: "down",
    },
    {
      label: "Cancelled Orders",
      value: data?.cancelledOrder,
      icon: Alert02Icon,
      footer: "Orders cancelled by users",
      trend: "down",
    },
    {
      label: "Action Required",
      value: data?.actionRequired,
      icon: CustomerService02Icon,
      footer: "Orders needing manual attention",
      trend: "down",
    },
    {
      label: "Total Orders",
      value: data?.totalOrders,
      icon: PackageIcon,
      footer: "Total processed orders",
      trend: "up",
    },
    {
      label: "Avg Delivery Time",
      value: data?.avgDeliveryTime,
      icon: Time04Icon,
      footer: "Average delivery performance",
      trend: "up",
    },
    {
      label: "Delivery Success Rate",
      value: data?.deliverySuccessRate,
      icon: PercentIcon,
      footer: "Successful delivery percentage",
      trend: "up",
    },
    {
      label: "Return Rate",
      value: data?.returnRate,
      icon: ChartDownIcon,
      footer: "Percentage of returned shipments",
      trend: "down",
    },
    {
      label: "Monthly Growth",
      value: data?.monthlyGrowth,
      icon: ChartUpIcon,
      footer: "Growth compared to last month",
      trend: "up",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <HugeiconsIcon icon={card.icon} strokeWidth={2} className="size-4" />
              {card.label}
            </CardDescription>

            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value ?? "-"}
            </CardTitle>

            {/* {isLoading ? (
              <Skeleton className="h-8 w-24" />
              ) : (
                card.value ?? "-"
              )}
            </CardTitle>

            {/* {!isLoading && (
              <CardAction>
                <Badge
                  variant="outline"
                  className={
                    card.trend === "down"
                      ? "text-red-500 border-red-200"
                      : "text-green-600 border-green-200"
                  }
                >
                  <HugeiconsIcon
                    icon={
                      card.trend === "down"
                        ? ChartDownIcon
                        : ChartUpIcon
                    }
                    strokeWidth={2}
                  />
                  {card.label === "Monthly Growth"
                    ? data?.monthlyGrowth
                    : card.trend === "down"
                    ? "Needs attention"
                    : "Healthy"}
                </Badge>
              </CardAction>
            )} */}
          </CardHeader>

          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              {card.footer}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
