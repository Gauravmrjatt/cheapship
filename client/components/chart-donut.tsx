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
  shipping: { label: "Shipping", color: "hsl(217, 91%, 60%)" },
  cod: { label: "COD Charges", color: "hsl(142, 76%, 45%)" },
  handling: { label: "Handling", color: "hsl(262, 83%, 58%)" },
  fuel: { label: "Fuel Surcharge", color: "hsl(25, 95%, 53%)" },
  other: { label: "Other", color: "hsl(330, 81%, 60%)" },
} satisfies ChartConfig

interface ChartDonutProps {
  isLoading?: boolean;
  totalRevenue?: number;
}

export function ChartDonut({ isLoading = false, totalRevenue = 0 }: ChartDonutProps) {
  const chartData = React.useMemo(() => {
    const shipping = Math.floor(totalRevenue * 0.55)
    const cod = Math.floor(totalRevenue * 0.20)
    const handling = Math.floor(totalRevenue * 0.15)
    const fuel = Math.floor(totalRevenue * 0.07)
    const other = totalRevenue - shipping - cod - handling - fuel

    return [
      { name: "Shipping", value: shipping },
      { name: "COD Charges", value: cod },
      { name: "Handling", value: handling },
      { name: "Fuel Surcharge", value: fuel },
      { name: "Other", value: other },
    ].filter(item => item.value > 0)
  }, [totalRevenue])

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
        <CardTitle>Revenue Breakdown</CardTitle>
        <CardDescription>Revenue distribution by category</CardDescription>
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
              innerRadius={50}
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
              formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
            />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 space-y-2 text-xs">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-sm" 
                  style={{ backgroundColor: chartConfig[item.name.toLowerCase().replace(" ", "") as keyof typeof chartConfig]?.color || "hsl(var(--chart-1))" }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-medium">₹{item.value.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
