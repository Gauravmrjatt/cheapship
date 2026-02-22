"use client";

import * as React from "react";
import { useState, Suspense } from "react";
import { useAdminTransactions } from "@/lib/hooks/use-admin";
import { TableSkeleton, PageHeaderSkeleton } from "@/components/skeletons";
import { TransactionsDataTable } from "@/components/transactions-data-table";
import { useSearchParams } from "next/navigation";

function TransactionsContent() {
  const searchParams = useSearchParams();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ 
    type: "ALL", 
    category: "ALL",
    search: "", 
    userId: "",
    fromDate: undefined as string | undefined,
    toDate: undefined as string | undefined
  });

  // Sync userId from searchParams after mount
  React.useEffect(() => {
    const userIdFromQuery = searchParams.get("userId") || "";
    if (userIdFromQuery) {
      setFilters(prev => ({ ...prev, userId: userIdFromQuery }));
    }
  }, [searchParams]);

  const { data, isLoading } = useAdminTransactions(
    page, 
    pageSize, 
    filters.type === "ALL" ? undefined : filters.type,
    filters.search,
    filters.userId,
    filters.category === "ALL" ? undefined : filters.category,
    filters.fromDate,
    filters.toDate
  );

  const handleFilterChange = (newFilters: { type?: string; category?: string; search?: string; userId?: string; fromDate?: string; toDate?: string }) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return (
    <div className="w-full space-y-0 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 px-0 lg:px-6">
        <p className="text-muted-foreground">
          {filters.userId 
            && `Viewing transactions for user ID: ${filters.userId}` 
          }
        </p>
      </div>

      <TransactionsDataTable 
        data={data?.data || []}
        isLoading={isLoading}
        showUserColumn={!filters.userId}
        pagination={data?.pagination}
        filters={filters}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}

export default function AdminTransactionsPage() {
  return (
    <Suspense fallback={
      <div className="w-full space-y-6 py-4">
        <PageHeaderSkeleton />
        <TableSkeleton rowCount={10} columnCount={6} />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
