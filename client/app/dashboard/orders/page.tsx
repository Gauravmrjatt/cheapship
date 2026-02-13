"use client";

import { useState } from "react";
import { useOrders } from "@/lib/hooks/use-orders";
import { OrdersDataTable } from "@/components/orders-data-table";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, isError } = useOrders(page, pageSize);

  if (isError) return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <p className="text-destructive">Error fetching orders</p>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <OrdersDataTable
            data={data?.data ?? []}
            isLoading={isLoading}
            pagination={{
              page,
              pageSize,
              totalPages: data?.pagination?.totalPages ?? 1,
              total: data?.pagination?.total ?? 0,
            }}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>
    </div>
  );
}
