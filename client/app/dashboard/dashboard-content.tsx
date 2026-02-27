'use client'
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { useDashboard } from "@/lib/hooks/use-dashboard"

export default function Dashboard() {
  const { data: dashboardData, isLoading, isError, error } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards data={dashboardData} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive isLoading={isLoading} data={dashboardData?.graphData} />
          </div>
        </div>
      </div>
    </div>
  )
}
