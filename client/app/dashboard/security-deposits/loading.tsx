import { TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-9">
          <TableSkeleton rowCount={10} columnCount={7} />
        </div>
      </div>
    </div>
  );
}
