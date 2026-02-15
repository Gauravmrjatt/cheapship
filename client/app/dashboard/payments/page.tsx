"use client";

import * as React from "react";
import { useState } from "react";
import { useTransactions, useTopUpWallet } from "@/lib/hooks/use-transactions";

import { TransactionsDataTable } from "@/components/transactions-data-table";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ type: "ALL", search: "" });
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");

  const { data, isLoading } = useTransactions(
    page, 
    pageSize, 
    filters.type === "ALL" ? undefined : filters.type
  );
  const topUpMutation = useTopUpWallet();

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    topUpMutation.mutate({ amount }, {
      onSuccess: () => {
        setShowTopUp(false);
        setTopUpAmount("");
      }
    });
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
        onFilterChange={setFilters}
      />

    
    </div>
  );
}
