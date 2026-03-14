"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
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
  DELIVERED: { label: "Delivered", color: "hsl(142, 76%, 45%)" },
  PENDING: { label: "Pending", color: "hsl(48, 96%, 53%)" },
  CANCELLED: { label: "Cancelled", color: "hsl(0, 84%, 60%)" },
} satisfies ChartConfig

interface GraphItem {
  date: string;
  DELIVERED: number;
  PENDING: number;
  CANCELLED: number;
  TOTAL: number;
  [key: string]: number | string;
}

interface ChartBarProps {
  isLoading?: boolean;
  data?: GraphItem[];
}

export function ChartBar({ isLoading = false, data = [] }: ChartBarProps) {
  const [timeRange, setTimeRange] = React.useState("14d")
  const [metric, setMetric] = React.useState<"all" | "delivered" | "pending">("all")

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
          <Skeleton className="h-9 w-32" />
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
        <CardTitle>Order Status by Day</CardTitle>
        <CardDescription>Daily breakdown by order status</CardDescription>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(v) => v && setTimeRange(v)}>
            <SelectTrigger className="w-28 h-8" aria-label="Select time range">
              <SelectValue placeholder="Last 14 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
              <SelectItem value="14d" className="rounded-lg">Last 14 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
            <SelectTrigger className="w-28 h-8" aria-label="Select metric">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">All</SelectItem>
              <SelectItem value="delivered" className="rounded-lg">Delivered</SelectItem>
              <SelectItem value="pending" className="rounded-lg">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={filteredData} accessibilityLayer>
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
            {(metric === "all" || metric === "delivered") && (
              <Bar 
                dataKey="DELIVERED" 
                name="Delivered"
                fill="hsl(142, 76%, 45%)" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
            )}
            {(metric === "all" || metric === "pending") && (
              <Bar 
                dataKey="PENDING" 
                name="Pending"
                fill="hsl(48, 96%, 53%)" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
            )}
            {metric === "all" && (
              <Bar 
                dataKey="CANCELLED" 
                name="Cancelled"
                fill="hsl(0, 84%, 60%)" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
