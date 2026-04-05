import { TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <TableSkeleton rowCount={10} columnCount={8} />
      </div>
    </div>
  );
}
