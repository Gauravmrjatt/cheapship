"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CreateOrderContent from "./create-order-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function CreateOrderSkeleton() {
  return (
    <div className="min-h-[calc(100vh-var(--header-height,80px))] bg-background/50 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="border rounded-xl p-4 md:p-6 flex justify-between px-8 md:px-20 bg-card shadow-sm">
        {["step-1", "step-2", "step-3", "step-4"].map(stepId => (
          <div key={stepId} className="flex flex-col items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

function CreateOrderPageContent() {
  const searchParams = useSearchParams();
  const courierId = searchParams.get("courier_id");
  const courierName = searchParams.get("courier_name");
  const rate = searchParams.get("rate");
  const paymentMode = searchParams.get("payment_mode");

  const preSelectedCourier = courierId ? {
    courier_company_id: parseInt(courierId),
    courier_name: courierName || "",
    rate: parseFloat(rate || "0"),
  } : null;

  const preSelectedPaymentMode = paymentMode || null;

  return <CreateOrderContent preSelectedCourier={preSelectedCourier} preSelectedPaymentMode={preSelectedPaymentMode} />;
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<CreateOrderSkeleton />}>
      <CreateOrderPageContent />
    </Suspense>
  );
}
