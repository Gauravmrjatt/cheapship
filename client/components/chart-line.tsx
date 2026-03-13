"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const chartConfig = {
  orders: { label: "Orders", color: "hsl(217, 91%, 60%)" },
  delivered: { label: "Delivered", color: "hsl(142, 76%, 45%)" },
  rto: { label: "RTO", color: "hsl(25, 95%, 53%)" },
} satisfies ChartConfig

interface GraphItem {
  date: string;
  TOTAL: number;
  DELIVERED: number;
  RTO: number;
  [key: string]: number | string;
}

interface ChartLineProps {
  isLoading?: boolean;
  data?: GraphItem[];
}

export function ChartLine({ isLoading = false, data = [] }: ChartLineProps) {
  const [timeRange, setTimeRange] = React.useState("30d")
  const [metric, setMetric] = React.useState<"all" | "orders" | "delivered" | "rto">("all")

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    
    const now = new Date()
    const daysToSubtract = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30
    
    const startDate = new Date()
    startDate.setDate(now.getDate() - daysToSubtract)
    
    return data.filter(item => new Date(item.date) >= startDate)
  }, [data, timeRange])

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  const lines = []
  if (metric === "all" || metric === "orders") {
    lines.push(
      <Line
        key="orders"
        type="monotone"
        dataKey="TOTAL"
        name="orders"
        stroke="hsl(217, 91%, 60%)"
        strokeWidth={2}
        dot={{ r: 3, fill: "hsl(217, 91%, 60%)" }}
        activeDot={{ r: 5 }}
      />
    )
  }
  if (metric === "all" || metric === "delivered") {
    lines.push(
      <Line
        key="delivered"
        type="monotone"
        dataKey="DELIVERED"
        name="delivered"
        stroke="hsl(142, 76%, 45%)"
        strokeWidth={2}
        dot={{ r: 3, fill: "hsl(142, 76%, 45%)" }}
        activeDot={{ r: 5 }}
      />
    )
  }
  if (metric === "all" || metric === "rto") {
    lines.push(
      <Line
        key="rto"
        type="monotone"
        dataKey="RTO"
        name="rto"
        stroke="hsl(25, 95%, 53%)"
        strokeWidth={2}
        dot={{ r: 3, fill: "hsl(25, 95%, 53%)" }}
        activeDot={{ r: 5 }}
      />
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Order Trends</CardTitle>
        <CardDescription>Track orders, deliveries, and RTO over time</CardDescription>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-28 h-8" aria-label="Select time range">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
              <SelectItem value="14d" className="rounded-lg">Last 14 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
            <SelectTrigger className="w-32 h-8" aria-label="Select metric">
              <SelectValue placeholder="All Metrics" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">All Metrics</SelectItem>
              <SelectItem value="orders" className="rounded-lg">Orders</SelectItem>
              <SelectItem value="delivered" className="rounded-lg">Delivered</SelectItem>
              <SelectItem value="rto" className="rounded-lg">RTO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart data={filteredData} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <Tooltip
              content={<ChartTooltipContent nameKey="name" />}
              labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            />
            <Legend />
            {lines}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
