"use client";

import * as React from "react";
import { useUserSecurityDeposits, SecurityDeposit } from "@/lib/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Wallet01Icon, 
  RefreshIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  MoneySendIcon,
  InformationCircleIcon
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function SecurityDepositsContent() {
  const { data, isLoading, refetch } = useUserSecurityDeposits();
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partial Used</Badge>;
      case 'FULLY_USED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Fully Used</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns: ColumnDef<SecurityDeposit>[] = React.useMemo(() => [
    {
      accessorKey: "order_id",
      header: "Order ID",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">#{row.original.order_id.toString()}</span>
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
        <span className="font-medium">₹{Number(row.original.amount).toLocaleString()}</span>
      )
    },
    {
      accessorKey: "used_amount",
      header: "Used",
      cell: ({ row }) => (
        <span className="text-red-600">-₹{Number(row.original.used_amount).toLocaleString()}</span>
      )
    },
    {
      accessorKey: "remaining",
      header: "Remaining",
      cell: ({ row }) => (
        <span className="text-green-600 font-semibold">₹{Number(row.original.remaining).toLocaleString()}</span>
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
        <span className="text-muted-foreground text-sm">{formatDate(row.original.created_at)}</span>
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 py-9">
        {/* Header */}
        <div className="flex flex-col gap-1 px-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Security Deposits</h1>
              <p className="text-muted-foreground">
                Track your security deposits and remaining amounts
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <HugeiconsIcon icon={RefreshIcon} className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 lg:px-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Deposited
              </CardTitle>
              <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  ₹{Number(data?.totals?.totalAmount || 0).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Used
              </CardTitle>
              <HugeiconsIcon icon={MoneySendIcon} className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-red-600">
                  -₹{Number(data?.totals?.totalUsed || 0).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Remaining
              </CardTitle>
              <HugeiconsIcon icon={ArrowUp01Icon} className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  ₹{Number(data?.totals?.totalRemaining || 0).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="mx-4 lg:mx-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HugeiconsIcon icon={Wallet01Icon} />
              Deposit History
            </CardTitle>
            <CardDescription>
              All your security deposits with usage details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : data?.data && data.data.length > 0 ? (
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
                        <TableRow key={row.id} className="hover:bg-muted/50">
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

                {/* Pagination */}
                {data.pagination && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((data.pagination.currentPage - 1) * data.pagination.pageSize) + 1} to{' '}
                      {Math.min(data.pagination.currentPage * data.pagination.pageSize, data.pagination.total)} of{' '}
                      {data.pagination.total} results
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
                  Your security deposits will appear here when you place orders. Each order creates a security deposit that can be used for disputes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mx-4 lg:mx-8 bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <HugeiconsIcon icon={InformationCircleIcon} className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How Security Deposits Work</p>
                <p>When you create an order, a security deposit is held in your security wallet. This amount is used for RTO and weight disputes. The remaining amount (after deductions) will be refunded when the admin triggers a refund schedule.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}