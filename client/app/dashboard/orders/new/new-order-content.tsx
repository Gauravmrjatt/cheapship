"use client";

import { Suspense } from "react";
import CreateOrderContent from "./create-order-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function CreateOrderSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="border rounded-xl p-10 flex justify-between px-20 bg-card shadow-sm">
        {["step-1", "step-2", "step-3", "step-4"].map(stepId => (
          <div key={stepId} className="flex flex-col items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="h-96 p-6">
          <Skeleton className="h-full w-full" />
        </Card>
        <Card className="h-96 p-6">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>
    </div>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<CreateOrderSkeleton />}>
      <CreateOrderContent />
    </Suspense>
  );
}
