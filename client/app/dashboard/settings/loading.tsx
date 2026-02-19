import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="py-10 px-4 space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-80 w-full max-w-4xl" />
    </div>
  );
}
