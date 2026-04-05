"use client";

import { useState } from "react";
import { useWeightDisputes } from "@/lib/hooks/use-dispute";
import { WeightDisputesDataTable } from "@/components/weight-disputes-data-table";

export default function WeightMismatchContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ status: "ALL", search: "" });

  const { data, isLoading, isError } = useWeightDisputes(page, pageSize, filters.status);

  const handleFilterChange = (newFilters: { status?: string; search?: string }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  if (isError) return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <p className="text-destructive">Error fetching weight disputes</p>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-9">
          <WeightDisputesDataTable
            data={data?.data ?? []}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={handleFilterChange}
            pagination={{
              currentPage: page,
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
