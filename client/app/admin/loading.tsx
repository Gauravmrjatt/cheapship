import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl border-none shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Orders Card */}
        <Card className="lg:col-span-4 rounded-2xl border-none shadow-sm p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center pt-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </Card>

        {/* Quick Actions Card */}
        <Card className="lg:col-span-3 rounded-2xl border-none shadow-sm p-6 space-y-6">
          <Skeleton className="h-6 w-28" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
