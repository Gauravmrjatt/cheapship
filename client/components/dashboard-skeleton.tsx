import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Section Cards Skeleton */}
          <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <Card key={index} className="@container/card">
                <div className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Order Status Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 px-4 lg:px-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={`status-${i}`} className="rounded-2xl border-none shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-8 rounded-lg mb-3" />
                  <Skeleton className="h-6 w-12 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Metrics Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 px-4 lg:px-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={`metric-${i}`} className="rounded-2xl border-none shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-7 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid Skeleton */}
          <div className="grid gap-6 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Area Chart Skeleton */}
            <Card className="@container/card lg:col-span-3">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </Card>

            {/* Pie Chart Skeleton */}
            <Card className="@container/card">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </Card>

            {/* Donut Chart Skeleton */}
            <Card className="@container/card">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </Card>

            {/* Bar Chart Skeleton */}
            <Card className="@container/card">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </Card>

            {/* Line Chart Skeleton */}
            <Card className="@container/card">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-9 w-48" />
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </Card>

            {/* Radar Chart Skeleton */}
            <Card className="@container/card">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </Card>

            {/* Horizontal Bar Chart Skeleton */}
            <Card className="@container/card">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </Card>
          </div>

          {/* Network Commission Card Skeleton */}
          <div className="px-4 lg:px-6">
            <Card className="@container/card">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Orders & Quick Actions Skeleton */}
          <div className="grid gap-6 px-4 lg:px-6 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <div className="p-4">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-xl">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="lg:col-span-3">
              <div className="p-4">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
