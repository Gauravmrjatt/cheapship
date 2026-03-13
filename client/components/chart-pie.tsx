"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip } from "recharts"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  DELIVERED: { label: "Delivered", color: "hsl(142, 76%, 45%)" },
  IN_TRANSIT: { label: "In Transit", color: "hsl(217, 91%, 60%)" },
  DISPATCHED: { label: "Dispatched", color: "hsl(262, 83%, 58%)" },
  MANIFESTED: { label: "Manifested", color: "hsl(199, 89%, 48%)" },
  PENDING: { label: "Pending", color: "hsl(48, 96%, 53%)" },
  RTO: { label: "RTO", color: "hsl(25, 95%, 53%)" },
  NOT_PICKED: { label: "Not Picked", color: "hsl(330, 81%, 60%)" },
  CANCELLED: { label: "Cancelled", color: "hsl(0, 84%, 60%)" },
} satisfies ChartConfig

interface OrderStatusData {
  deliveredOrders: number;
  inTransitOrders: number;
  dispatchedOrders: number;
  manifestedOrders: number;
  rtoOrders: number;
  pendingOrders: number;
  notPickedOrders: number;
  cancelledOrders: number;
}

interface ChartPieProps {
  isLoading?: boolean;
  data?: OrderStatusData;
}

export function ChartPie({ isLoading = false, data }: ChartPieProps) {
  const chartData = React.useMemo(() => {
    if (!data) return []
    
    const total = 
      data.deliveredOrders + 
      data.inTransitOrders + 
      data.dispatchedOrders + 
      data.manifestedOrders + 
      data.rtoOrders + 
      data.pendingOrders + 
      data.notPickedOrders + 
      data.cancelledOrders

    if (total === 0) return []

    return [
      { name: "Delivered", value: data.deliveredOrders, percentage: ((data.deliveredOrders / total) * 100).toFixed(1) },
      { name: "In Transit", value: data.inTransitOrders, percentage: ((data.inTransitOrders / total) * 100).toFixed(1) },
      { name: "Dispatched", value: data.dispatchedOrders, percentage: ((data.dispatchedOrders / total) * 100).toFixed(1) },
      { name: "Manifested", value: data.manifestedOrders, percentage: ((data.manifestedOrders / total) * 100).toFixed(1) },
      { name: "RTO", value: data.rtoOrders, percentage: ((data.rtoOrders / total) * 100).toFixed(1) },
      { name: "Pending", value: data.pendingOrders, percentage: ((data.pendingOrders / total) * 100).toFixed(1) },
      { name: "Not Picked", value: data.notPickedOrders, percentage: ((data.notPickedOrders / total) * 100).toFixed(1) },
      { name: "Cancelled", value: data.cancelledOrders, percentage: ((data.cancelledOrders / total) * 100).toFixed(1) },
    ].filter(item => item.value > 0)
  }, [data])

  const totalOrders = chartData.reduce((sum, item) => sum + item.value, 0)

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Order Status Distribution</CardTitle>
        <CardDescription>Percentage breakdown by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={Object.values(chartConfig)[index]?.color || "hsl(var(--chart-1))"} 
                />
              ))}
            </Pie>
            <Tooltip
              content={<ChartTooltipContent nameKey="name" />}
              formatter={(value: number, name: string) => [value, name]}
            />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.percentage}%</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t text-center">
          <span className="text-sm text-muted-foreground">Total: </span>
          <span className="text-lg font-bold">{totalOrders}</span>
        </div>
      </CardContent>
    </Card>
  )
}
