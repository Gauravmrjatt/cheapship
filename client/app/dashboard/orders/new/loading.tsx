import { FormSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
      {/* Stepper skeleton */}
      <div className="flex items-center justify-between mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            <div className="hidden sm:block w-16 h-4 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <FormSkeleton />
    </div>
  );
}
