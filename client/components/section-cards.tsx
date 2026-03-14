"use client"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function SectionCards({
  data,
}: {
  data: DashboardData
}) {
  const router = useRouter()

  const cards = [
    {
      label: "Delivered Orders",
      value: data?.deliveredOrders,
      icon: DeliveryBox01Icon,
      footer: "Successfully delivered shipments",
      trend: "up",
      status: "DELIVERED",
      clickable: true,
    },
    {
      label: "In Transit Orders",
      value: data?.inTransitOrders,
      icon: TruckIcon,
      footer: "Orders currently on the way",
      trend: "up",
      status: "IN_TRANSIT",
      clickable: true,
    },
    {
      label: "Dispatched Orders",
      value: data?.dispatchedOrders,
      icon: PackageIcon,
      footer: "Orders shipped from warehouse",
      trend: "up",
      status: "DISPATCHED",
      clickable: true,
    },
    {
      label: "Manifested Orders",
      value: data?.manifestedOrders,
      icon: BarChartIcon,
      footer: "Orders processed & manifested",
      trend: "up",
      status: "MANIFESTED",
      clickable: true,
    },
    {
      label: "RTO Orders",
      value: data?.rtoOrders,
      icon: Cancel01Icon,
      footer: "Returned to origin shipments",
      trend: "down",
      status: "RTO_IN_TRANSIT",
      clickable: true,
    },
    {
      label: "Cancelled Orders",
      value: data?.cancelledOrder,
      icon: Alert02Icon,
      footer: "Orders cancelled by users",
      trend: "down",
      status: "CANCELLED",
      clickable: true,
    },
    {
      label: "Action Required",
      value: data?.actionRequired,
      icon: CustomerService02Icon,
      footer: "Orders needing manual attention",
      trend: "down",
      // status: "ACTION_REQUIRED",
      // clickable: true,
    },
    {
      label: "Total Orders",
      value: data?.totalOrders,
      icon: PackageIcon,
      footer: "Total processed orders",
      trend: "up",
      status: "ALL",
      clickable: true,
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
      label: "Total Weight Shipped",
      value: data?.totalWeightShipped,
      icon: BarChartIcon,
      footer: "Accumulated weight over lifetime",
      trend: "up",
    },
    {
      label: "Weight Disputes",
      value: data?.weightDisputeOrders,
      icon: Alert02Icon,
      footer: "Pending weight anomalies",
      trend: "down",
    },
    {
      label: "Last Month Orders",
      value: data?.lastMonthOrders,
      icon: Time04Icon,
      footer: "Orders completed last month",
      trend: "up",
    },
    {
      label: "Monthly Growth",
      value: data?.monthlyGrowth,
      icon: ChartUpIcon,
      footer: "Growth compared to last month",
      trend: "up",
    },
  ]

  const handleCardClick = (status: string | undefined) => {
    if (status) {
      router.push(`/dashboard/orders?shipment_status=${status}`)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 px-3 sm:gap-4 sm:px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={cn("@container/card", card.clickable && "cursor-pointer hover:shadow-md transition-shadow")}
          onClick={() => handleCardClick(card.status)}
        >
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
