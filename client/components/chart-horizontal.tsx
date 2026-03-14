"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts"
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
  orders: { label: "Orders", color: "hsl(217, 91%, 60%)" },
  revenue: { label: "Revenue", color: "hsl(142, 76%, 45%)" },
} satisfies ChartConfig

interface TopCourierData {
  courier_name: string;
  order_count: number;
  revenue: number;
}

interface TopUserData {
  name: string;
  order_count: number;
  revenue: number;
}

interface ChartHorizontalProps {
  isLoading?: boolean;
  topCouriers?: TopCourierData[];
  topUsers?: TopUserData[];
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 45%)",
  "hsl(262, 83%, 58%)",
  "hsl(25, 95%, 53%)",
  "hsl(330, 81%, 60%)",
  "hsl(199, 89%, 48%)",
  "hsl(48, 96%, 53%)",
  "hsl(280, 65%, 60%)",
]

export function ChartHorizontal({ isLoading = false, topCouriers, topUsers }: ChartHorizontalProps) {
  const [view, setView] = React.useState<"couriers" | "users">("couriers")

  const chartData = React.useMemo(() => {
    if (view === "couriers" && topCouriers) {
      return topCouriers.slice(0, 8).map((item) => ({
        name: item.courier_name || "Unknown",
        value: item.order_count,
        revenue: item.revenue,
      }))
    }
    if (view === "users" && topUsers) {
      return topUsers.slice(0, 8).map((item) => ({
        name: item.name || "Unknown",
        value: item.order_count,
        revenue: item.revenue,
      }))
    }
    return []
  }, [view, topCouriers, topUsers])

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-48" />
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
        <CardTitle>{view === "couriers" ? "Top Couriers" : "Top Users"}</CardTitle>
        <CardDescription>
          {view === "couriers" ? "Couriers by order volume" : "Users by order count"}
        </CardDescription>
        <div className="flex gap-2">
          <button
            onClick={() => setView("couriers")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              view === "couriers" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Couriers
          </button>
          <button
            onClick={() => setView("users")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              view === "users" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Users
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart 
            data={chartData} 
            layout="vertical" 
            accessibilityLayer
            margin={{ left: 0, right: 20 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              type="number" 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8}
              fontSize={12}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8}
              fontSize={11}
              width={80}
            />
            <Tooltip
              content={<ChartTooltipContent nameKey="name" />}
              labelFormatter={(label) => [label, view === "couriers" ? "Courier" : "User"]}
              formatter={(value: number, name: string, props: any) => [
                view === "couriers" ? value : `${value} orders (₹${props?.payload?.revenue?.toLocaleString("en-IN")})`,
                "Orders"
              ]}
            />
            <Bar 
              dataKey="value" 
              name="orders"
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="mt-4 space-y-1 text-xs">
          {chartData.slice(0, 5).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-2 w-2 rounded-sm" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-muted-foreground truncate max-w-[150px]">{item.name}</span>
              </div>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
