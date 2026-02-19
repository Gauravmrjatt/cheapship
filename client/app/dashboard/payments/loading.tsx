import { TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="w-full py-10 space-y-8">
      <TableSkeleton rowCount={10} columnCount={6} />
    </div>
  );
}
