"use client";

import { useState } from "react";
import { useAdminFeedback, FeedbackFilters } from "@/lib/hooks/use-admin-feedback";
import { AdminFeedbackDataTable } from "@/components/admin-feedback-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Comment01Icon } from "@hugeicons/core-free-icons";

export default function FeedbackPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<FeedbackFilters>({
    type: "ALL",
    search: "",
  });

  const { data, isLoading, isError } = useAdminFeedback(page, pageSize, filters);

  const handleFilterChange = (newFilters: FeedbackFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  if (isError) return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <p className="text-destructive">Error fetching feedback</p>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 ">
          <AdminFeedbackDataTable
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
