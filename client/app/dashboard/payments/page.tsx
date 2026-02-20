"use client";

import * as React from "react";
import { useState } from "react";
import { useTransactions, } from "@/lib/hooks/use-transactions";
import { useAuth } from "@/lib/hooks/use-auth";
import { TransactionsDataTable } from "@/components/transactions-data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ 
    type: "ALL", 
    category: "ALL",
    search: "",
    fromDate: undefined as string | undefined,
    toDate: undefined as string | undefined
  });


  const { data, isLoading } = useTransactions(
    page, 
    pageSize, 
    filters.type === "ALL" ? undefined : filters.type,
    filters.category === "ALL" ? undefined : filters.category,
    undefined,
    filters.search,
    filters.fromDate,
    filters.toDate
  );

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };


  return (
    <div className="w-full py-10 space-y-8 animate-in fade-in duration-500">
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
