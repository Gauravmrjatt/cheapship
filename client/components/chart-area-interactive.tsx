"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Orders analytics chart"

const chartConfig = {
  DELIVERED: {
    label: "Delivered",
    color: "hsl(142, 76%, 45%)", // Emerald Green
  },
  IN_TRANSIT: {
    label: "In Transit",
    color: "hsl(217, 91%, 60%)", // Royal Blue
  },
  DISPATCHED: {
    label: "Dispatched",
    color: "hsl(262, 83%, 58%)", // Vivid Violet
  },
  MANIFESTED: {
    label: "Manifested",
    color: "hsl(199, 89%, 48%)", // Sky Blue
  },
  PENDING: {
    label: "Pending",
    color: "hsl(48, 96%, 53%)", // Golden Amber
  },
  NOT_PICKED: {
    label: "Not Picked",
    color: "hsl(330, 81%, 60%)", // Pink/Rose
  },
  RTO: {
    label: "RTO",
    color: "hsl(25, 95%, 53%)", // Vibrant Orange
  },
  CANCELLED: {
    label: "Cancelled",
    color: "hsl(0, 84%, 60%)", // Bright Red
  },
  TOTAL: {
    label: "Total",
    color: "hsl(var(--primary))",
  }
} satisfies ChartConfig

interface GraphItem {
  date: string;
  DELIVERED: number;
  PENDING: number;
  CANCELLED: number;
  IN_TRANSIT: number;
  DISPATCHED: number;
  MANIFESTED: number;
  RTO: number;
  NOT_PICKED: number;
  TOTAL: number;
}

export function ChartAreaInteractive({ 
  isLoading = false, 
  data = [] 
}: { 
  isLoading?: boolean;
  data?: GraphItem[];
}) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    
    const now = new Date()
    const daysToSubtract = timeRange === "7d" ? 7 : 30
    
    const startDate = new Date()
    startDate.setDate(now.getDate() - daysToSubtract)
    
    return data.filter(item => new Date(item.date) >= startDate)
  }, [data, timeRange])

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-32 bg-muted rounded-md animate-pulse" />
          </CardTitle>
          <CardDescription>
            <div className="h-4 w-48 bg-muted rounded-md animate-pulse" />
          </CardDescription>
          <CardAction>
            <div className="h-9 w-40 bg-muted rounded-md animate-pulse" />
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[250px] w-full bg-muted rounded-md animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Order Analytics</CardTitle>
        <CardDescription>
          <span>Showing full status distribution for the last {timeRange === "7d" ? "7 days" : "30 days"}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              if (value[0]) setTimeRange(value[0])
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              {Object.entries(chartConfig).map(([key, config]) => (
                <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {/* Areas stacked from bottom to top */}
            <Area
              dataKey="CANCELLED"
              type="monotone"
              fill="url(#fillCANCELLED)"
              stroke={chartConfig.CANCELLED.color}
              stackId="a"
            />
            <Area
              dataKey="RTO"
              type="monotone"
              fill="url(#fillRTO)"
              stroke={chartConfig.RTO.color}
              stackId="a"
            />
            <Area
              dataKey="NOT_PICKED"
              type="monotone"
              fill="url(#fillNOT_PICKED)"
              stroke={chartConfig.NOT_PICKED.color}
              stackId="a"
            />
            <Area
              dataKey="PENDING"
              type="monotone"
              fill="url(#fillPENDING)"
              stroke={chartConfig.PENDING.color}
              stackId="a"
            />
            <Area
              dataKey="MANIFESTED"
              type="monotone"
              fill="url(#fillMANIFESTED)"
              stroke={chartConfig.MANIFESTED.color}
              stackId="a"
            />
            <Area
              dataKey="DISPATCHED"
              type="monotone"
              fill="url(#fillDISPATCHED)"
              stroke={chartConfig.DISPATCHED.color}
              stackId="a"
            />
            <Area
              dataKey="IN_TRANSIT"
              type="monotone"
              fill="url(#fillIN_TRANSIT)"
              stroke={chartConfig.IN_TRANSIT.color}
              stackId="a"
            />
            <Area
              dataKey="DELIVERED"
              type="monotone"
              fill="url(#fillDELIVERED)"
              stroke={chartConfig.DELIVERED.color}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
