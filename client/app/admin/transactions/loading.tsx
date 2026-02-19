import { AdminTableSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="w-full space-y-6 py-4">
      <PageHeaderSkeleton />
      <AdminTableSkeleton rowCount={10} />
    </div>
  );
}
