"use client";

import * as React from "react";
import { Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CODOrdersDataTable, CODOrder } from "@/components/cod-orders-data-table";
import { TableSkeleton } from "@/components/skeletons";
import { useHttp } from "@/lib/hooks/use-http";
import { sileo } from "sileo";

function CODOrdersContent() {
  const http = useHttp();
  const queryClient = useQueryClient();

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [filters, setFilters] = React.useState({ status: "ALL", search: "" });

  const { data, isLoading } = useQuery<{
    data: CODOrder[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
    summary: {
      totalPendingCOD: number;
      totalRemitted: number;
    };
  }>(
    http.get(
      ["admin-cod-orders", page, pageSize, filters.status, filters.search],
      `/admin/cod-orders?page=${page}&pageSize=${pageSize}&remittance_status=${filters.status}${filters.search ? `&search=${filters.search}` : ""}`,
      true
    )
  );

  const [selectedOrder, setSelectedOrder] = React.useState<CODOrder | null>(null);

  const updateRemittanceMutation = useMutation(
    http.patch(`/admin/orders/${selectedOrder?.id}/remittance`, {
      onSuccess: () => {
        sileo.success({ title: "Success", description: "Remittance status updated" });
        queryClient.invalidateQueries({ queryKey: ["admin-cod-orders"] });
        setSelectedOrder(null);
      },
      onError: (error: Error) => {
        sileo.error({ title: "Error", description: error.message || "Failed to update remittance" });
      },
    })
  );

  const handleFilterChange = (newFilters: { status: string; search: string }) => {
    setFilters(newFilters);
  };

  const handleUpdateRemittance = (order: CODOrder, data: { remittance_status: string; remitted_amount?: number; remittance_ref_id?: string }) => {
    setSelectedOrder(order);
    setTimeout(() => {
      updateRemittanceMutation.mutate(data);
    }, 0);
  };

  return (
    <div className="w-full space-y-0 animate-in fade-in duration-500">
      <CODOrdersDataTable 
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination ? {
          currentPage: data.pagination.currentPage,
          pageSize: data.pagination.pageSize,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        } : undefined}
        summary={data?.summary}
        filters={filters}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onFilterChange={handleFilterChange}
        onUpdateRemittance={handleUpdateRemittance}
        isUpdating={updateRemittanceMutation.isPending}
      />
    </div>
  );
}

export default function AdminCODOrdersPage() {
  return (
    <Suspense fallback={
      <div className="w-full space-y-6 py-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 bg-muted animate-pulse rounded" />
          <div className="h-24 bg-muted animate-pulse rounded" />
          <div className="h-24 bg-muted animate-pulse rounded" />
        </div>
        <TableSkeleton rowCount={10} columnCount={8} />
      </div>
    }>
      <CODOrdersContent />
    </Suspense>
  );
}
