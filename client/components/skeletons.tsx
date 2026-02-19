import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function TableSkeleton({ rowCount = 5, columnCount = 6 }: { rowCount?: number; columnCount?: number }) {
  return (
    <div className="w-full space-y-4">
      {/* Tabs/Filter bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="border rounded-2xl overflow-hidden">
        <div className="bg-muted p-4">
          <div className="flex gap-4">
            {Array.from({ length: columnCount }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 items-center">
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-8 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ rowCount = 10 }: { rowCount?: number }) {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Filter/Tabs bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <div className="hidden lg:flex items-center gap-2 bg-muted p-1 rounded-lg">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-2xl overflow-hidden bg-card">
        {/* Header */}
        <div className="bg-muted p-4 border-b">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-24 flex-1" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-4 w-28 flex-1" />
            <Skeleton className="h-4 w-24 flex-1" />
            <Skeleton className="h-4 w-20 flex-1" />
            <Skeleton className="h-4 w-24 flex-1" />
          </div>
        </div>
        {/* Rows */}
        <div className="divide-y">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 text-right" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
      {/* Title skeleton */}
      <Skeleton className="h-10 w-48" />
      
      {/* Order Info Card */}
      <Card className="rounded-xl shadow-sm">
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Address Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="rounded-xl shadow-sm">
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function CardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="h-48 p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="pt-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
      <Skeleton className="h-10 w-48" />
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-32" />
      </Card>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-4 lg:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
