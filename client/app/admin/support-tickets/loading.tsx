import { TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="grid gap-6 lg:grid-cols-3 flex-1">
        <div className="lg:col-span-2">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-9">
              <TableSkeleton rowCount={10} columnCount={5} />
            </div>
          </div>
        </div>
        <div>
          <div className="h-[400px] bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
