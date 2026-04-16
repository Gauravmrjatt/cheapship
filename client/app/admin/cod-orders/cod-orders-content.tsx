"use client";

import * as React from "react";
import { Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CODUserGroupsDataTable, CODUserGroup } from "@/components/cod-orders-data-table";
import { TableSkeleton } from "@/components/skeletons";
import { useHttp } from "@/lib/hooks/use-http";
import { useAdminCODUserGroups, useUpdateUserCODRemittance, AdminCODOrdersResponse } from "@/lib/hooks/use-admin";
import { sileo } from "sileo";

function CODOrdersContent() {
  const queryClient = useQueryClient();

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [filters, setFilters] = React.useState({ status: "ALL", search: "", order_source: "ALL" });

  const { data, isLoading } = useAdminCODUserGroups(
    page,
    pageSize,
    filters.status,
    filters.search,
    filters.order_source
  );

  const updateRemittanceMutation = useUpdateUserCODRemittance();

  const handleFilterChange = (newFilters: { status: string; search: string; order_source: string }) => {
    setFilters(newFilters);
  };

  const handleUpdateRemittance = (userGroup: CODUserGroup, data: { 
    remittance_status: string; 
    remitted_amount?: number; 
    remittance_ref_id?: string;
    payout_status?: string;
  }) => {
    updateRemittanceMutation.mutate({
      userId: userGroup.user.id,
      ...data
    });
  };

  return (
    <div className="w-full space-y-0 animate-in fade-in duration-500">
      <CODUserGroupsDataTable
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