"use client";

import * as React from "react";
import { useState, Suspense } from "react";
import { useAdminTransactions } from "@/lib/hooks/use-admin";
import { TransactionsDataTable } from "@/components/transactions-data-table";
import { useSearchParams } from "next/navigation";

function TransactionsContent() {
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get("userId") || "";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ 
    type: "ALL", 
    search: "", 
    userId: userIdFromQuery 
  });

  const { data, isLoading } = useAdminTransactions(
    page, 
    pageSize, 
    filters.type,
    filters.search,
    filters.userId
  );

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          {filters.userId 
            ? `Viewing transactions for user ID: ${filters.userId}` 
            : "Monitor and manage all system transactions."}
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
    <Suspense fallback={<div>Loading transactions...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
