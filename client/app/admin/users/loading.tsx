import { AdminTableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="w-full py-4">
      <AdminTableSkeleton rowCount={10} />
    </div>
  );
}
