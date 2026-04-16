import { CardsGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded-xl animate-pulse" />
        <div className="h-4 w-96 bg-muted rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
      <CardsGridSkeleton count={6} />
    </div>
  );
}
