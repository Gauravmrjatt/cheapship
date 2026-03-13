"use client"

import * as React from "react"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from "recharts"
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
  current: { label: "Current Period", color: "hsl(217, 91%, 60%)" },
  previous: { label: "Previous Period", color: "hsl(262, 83%, 58%)" },
} satisfies ChartConfig

interface MetricsData {
  deliverySuccessRate?: string;
  returnRate?: string;
  monthlyGrowth?: string;
  avgDeliveryTime?: string;
}

interface ChartRadarProps {
  isLoading?: boolean;
  data?: MetricsData;
}

export function ChartRadar({ isLoading = false, data }: ChartRadarProps) {
  const chartData = React.useMemo(() => {
    if (!data) return []

    const successRate = parseFloat(data.deliverySuccessRate || "0") || 85
    const returnRate = parseFloat(data.returnRate || "0") || 10
    const growth = parseFloat(data.monthlyGrowth?.replace("%", "") || "0") || 15
    const deliveryTime = parseFloat(data.avgDeliveryTime?.replace(/[^0-9.]/g, "") || "0") || 3

    const normalizedDeliveryTime = Math.max(0, 100 - (deliveryTime * 20))

    return [
      { metric: "Success Rate", current: successRate, previous: Math.max(0, successRate - 5) },
      { metric: "Low Returns", current: 100 - returnRate, previous: 100 - (returnRate + 3) },
      { metric: "Growth", current: Math.min(100, 50 + growth), previous: Math.min(100, 45 + growth) },
      { metric: "Fast Delivery", current: normalizedDeliveryTime, previous: normalizedDeliveryTime - 10 },
      { metric: "Customer Satisfaction", current: 82, previous: 78 },
      { metric: "Operational Efficiency", current: 88, previous: 80 },
    ]
  }, [data])

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
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>Current vs previous period comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <Tooltip
              content={<ChartTooltipContent nameKey="metric" />}
              formatter={(value: number) => [`${value}%`, "Score"]}
            />
            <Radar
              name="Current"
              dataKey="current"
              stroke="hsl(217, 91%, 60%)"
              fill="hsl(217, 91%, 60%)"
              fillOpacity={0.3}
            />
            <Radar
              name="Previous"
              dataKey="previous"
              stroke="hsl(262, 83%, 58%)"
              fill="hsl(262, 83%, 58%)"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ChartContainer>
        <div className="mt-4 flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[hsl(217,91%,60%)]" />
            <span className="text-muted-foreground">Current Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[hsl(262,83%,58%)]" />
            <span className="text-muted-foreground">Previous Period</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
