"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Loading03Icon,
  Search01Icon,
  Calendar01Icon,
  LeftToRightListBulletIcon,
  ArrowDown01Icon,
  SearchIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { useHttp } from "@/lib/hooks/use-http";
import { DateRangePicker } from "@/components/ui/date-picker";
import { DataTablePagination } from "@/components/orders-table-components";
import { cn } from "@/lib/utils";

interface RemittanceSummary {
  totalCODCollected: number;
  pendingRemittanceAmount: number;
  lastRemittedAmount: number;
  lastRemittedAt: string | null;
  estimatedNextRemittanceDate: string;
}

interface RemittanceOrder {
  id: string;
  order_type: string;
  shipment_status: string;
  cod_amount: number;
  remitted_amount?: number;
  remitted_at?: string;
  remittance_ref_id?: string;
  created_at: string;
  order_receiver_address?: {
    name: string;
    city: string;
    state: string;
  };
}

export default function RemittancesPage() {
  const http = useHttp();
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");

  const queryParams = new URLSearchParams();
  if (fromDate) queryParams.append("fromDate", fromDate.toISOString());
  if (toDate) queryParams.append("toDate", toDate.toISOString());

  const { data: summary, isLoading: isLoadingSummary } = useQuery<RemittanceSummary>(
    http.get(["remittances", "summary", fromDate, toDate], `/orders/remittances/summary?${queryParams.toString()}`)
  );

  const { data: pendingData, isLoading: isLoadingPending } = useQuery<{ orders: RemittanceOrder[]; totalPending: number }>(
    http.get(["remittances", "pending", fromDate, toDate], `/orders/remittances/pending?${queryParams.toString()}`)
  );

  const { data: historyData, isLoading: isLoadingHistory } = useQuery<RemittanceOrder[]>(
    http.get(["remittances", "history", fromDate, toDate], `/orders/remittances/history?${queryParams.toString()}`)
  );

  const tableData = activeTab === "pending" ? (pendingData?.orders || []) : (historyData || []);
  const isLoading = activeTab === "pending" ? isLoadingPending : isLoadingHistory;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const columns = React.useMemo<ColumnDef<RemittanceOrder>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <span className="text-foreground font-medium uppercase">
          #{row.original.id.toString().slice(0, 8)}
        </span>
      ),
    },
    {
      id: "receiver",
      header: "Receiver",
      cell: ({ row }) => {
        const addr = row.original.order_receiver_address;
        return (
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium text-xs text-foreground">{addr?.name || "-"}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{addr?.city || "-"}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "cod_amount",
      header: () => <div className="text-right">COD Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums">
          {formatCurrency(row.original.cod_amount)}
        </div>
      ),
    },
    ...(activeTab === "history" ? [
      {
        accessorKey: "remitted_amount",
        header: "Settled Amount",
        cell: ({ row }: any) => (
          <div className="font-bold text-green-600 tabular-nums">
            {formatCurrency(row.original.remitted_amount)}
          </div>
        ),
      },
      {
        accessorKey: "remittance_ref_id",
        header: "Reference ID",
        cell: ({ row }: any) => (
          <code className="text-[10px] bg-muted px-2 py-1 rounded font-mono font-medium">
            {row.original.remittance_ref_id || "-"}
          </code>
        ),
      }
    ] : [
      {
        accessorKey: "shipment_status",
        header: "Status",
        cell: ({ row }: any) => (
          <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5 border-amber-200 bg-amber-50/50">
            <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin size-3 text-amber-600" />
            {row.original.shipment_status?.toLowerCase().replace(/_/g, " ")}
          </Badge>
        ),
      }
    ]),
    {
      accessorKey: activeTab === "pending" ? "created_at" : "remitted_at",
      header: () => <div className="text-right pr-6">{activeTab === "pending" ? "Order Date" : "Settled On"}</div>,
      cell: ({ row }) => (
        <div className="text-right pr-6 text-xs text-muted-foreground font-medium">
          {formatDate((activeTab === "pending" ? row.original.created_at : row.original.remitted_at) || null)}
        </div>
      ),
    },
  ], [activeTab]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full space-y-6 animate-in p-5 fade-in duration-500 overflow-hidden">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Pending Remittance</p>
          {isLoadingSummary ? <div className="h-7 w-32 bg-muted animate-pulse rounded mt-1" /> : (
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary?.pendingRemittanceAmount || 0)}</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Last Remitted</p>
          {isLoadingSummary ? <div className="h-7 w-32 bg-muted animate-pulse rounded mt-1" /> : (
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.lastRemittedAmount || 0)}</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Estimated Next Date</p>
          {isLoadingSummary ? <div className="h-7 w-32 bg-muted animate-pulse rounded mt-1" /> : (
            <p className="text-2xl font-bold text-blue-600">{formatDate(summary?.estimatedNextRemittanceDate || null)}</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Date range</p>
          {/* {isLoadingSummary ? <div className="h-7 w-32 bg-muted animate-pulse rounded mt-1" /> : (
            <p className="text-2xl font-bold text-primary">{formatCurrency(summary?.totalCODCollected || 0)}</p>
          )} */}
             <DateRangePicker 
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />

        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
          <TabsList className="bg-muted/50 p-1 rounded-xl w-fit">
            <TabsTrigger value="pending" className="rounded-lg gap-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium">
              Pending ({pendingData?.orders?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium">
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <div className="relative w-full sm:w-64 min-w-[150px]">
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

       
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} data-icon="inline-start" />
              <span className="hidden lg:inline">Columns</span>
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table.getAllColumns().filter(c => c.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={v => column.toggleVisibility(!!v)}
                >
                  {column.id.replace(/_/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}
      </div>

      <div className="overflow-x-auto border rounded-2xl shadow-sm bg-background">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium text-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <HugeiconsIcon icon={Loading03Icon} className="size-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <HugeiconsIcon icon={Search01Icon} size={32} className="opacity-20" />
                    <p className="font-medium">No results found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        pagination={{
          currentPage: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
          totalPages: table.getPageCount(),
          total: table.getFilteredRowModel().rows.length
        }}
        onPageChange={(p) => table.setPageIndex(p - 1)}
        onPageSizeChange={(s) => table.setPageSize(s)}
        filteredCount={table.getFilteredRowModel().rows.length}
      />
    </div>
  );
}
