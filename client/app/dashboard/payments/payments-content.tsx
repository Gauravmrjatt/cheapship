"use client";

import * as React from "react";
import { useState } from "react";
import { useTransactions, } from "@/lib/hooks/use-transactions";
import { useAuth } from "@/lib/hooks/use-auth";
import { TransactionsDataTable } from "@/components/transactions-data-table";

interface FilterValues {
  type?: string;
  category?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export default function PaymentsPage() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ 
    type: "ALL", 
    category: "ALL",
    search: "",
    fromDate: undefined as string | undefined,
    toDate: undefined as string | undefined
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useTransactions(
    page, 
    pageSize, 
    filters.type === "ALL" ? undefined : filters.type,
    filters.category === "ALL" ? undefined : filters.category,
    undefined,
    filters.search,
    filters.fromDate,
    filters.toDate,
    mounted
  );

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  if (!mounted) return null;

  return (
    <div className="w-full py-10 space-y-8 p-5 animate-in fade-in duration-500">
      <TransactionsDataTable 
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        filters={filters}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
