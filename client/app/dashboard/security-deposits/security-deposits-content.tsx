"use client";

import * as React from "react";
import { useUserSecurityDeposits, SecurityDeposit } from "@/lib/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Wallet01Icon, 
  RefreshIcon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function SecurityDepositsContent() {
  const { data, isLoading, refetch } = useUserSecurityDeposits();
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'PARTIAL':
        return <Badge variant="secondary">Partial</Badge>;
      case 'FULLY_USED':
        return <Badge variant="destructive">Used</Badge>;
      case 'REFUNDED':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns: ColumnDef<SecurityDeposit>[] = React.useMemo(() => [
    {
      accessorKey: "order_id",
      header: "Order ID",
      cell: ({ row }) => (
        <span className="font-medium">#{row.original.order_id.toString()}</span>
      )
    },
    {
      accessorKey: "order",
      header: "Order Status",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.order?.shipment_status || '-'}</span>
      )
    },
    {
      accessorKey: "amount",
      header: "Original",
      cell: ({ row }) => (
        <span>{formatCurrency(row.original.amount)}</span>
      )
    },
    {
      accessorKey: "used_amount",
      header: "Used",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatCurrency(row.original.used_amount)}</span>
      )
    },
    {
      accessorKey: "remaining",
      header: "Remaining",
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.remaining)}</span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>
      )
    }
  ], []);

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    pageCount: data?.pagination?.totalPages || 1,
    manualPagination: true,
  });

  const deposits = data?.data || [];

  return (
    <div className="space-y-8 p-5 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deposited
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(data?.totals?.totalAmount || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              All security deposits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(data?.totals?.totalUsed || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              For disputes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(data?.totals?.totalRemaining || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              To be refunded
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : deposits.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="text-xs font-medium uppercase text-muted-foreground">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((data.pagination.currentPage - 1) * data.pagination.pageSize) + 1} to{' '}
                    {Math.min(data.pagination.currentPage * data.pagination.pageSize, data.pagination.total)} of{' '}
                    {data.pagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-muted p-4 mb-4">
                <HugeiconsIcon icon={Wallet01Icon} className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No Security Deposits</h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm">
                Your security deposits will appear here when you place orders.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}