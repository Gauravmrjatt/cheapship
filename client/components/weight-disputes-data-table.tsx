"use client"

import * as React from "react"
import copy from "copy-to-clipboard";
import { sileo } from "sileo";
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
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  SearchIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  WeightScale01Icon,
  Loading03Icon,
  Cancel01Icon,
  ArrowRightIcon,
  LinkCircle02Icon,
  CopyIcon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"

export type WeightDispute = {
  id: string;
  order_id: string;
  applied_weight: number;
  charged_weight: number;
  applied_amount: number;
  charged_amount: number;
  status: string;
  tracking_number?: string;
  created_at: string;

  order?: {
    id: string;
    tracking_number: string;
    courier_name?: string;
    length?: number | null;
    width?: number | null;
    height?: number | null;
  };
}

interface WeightDisputesDataTableProps {
  data: WeightDispute[]
  isLoading?: boolean
  pagination?: {
    currentPage: number
    pageSize: number
    totalPages: number
    total: number
  }
  filters?: {
    status?: string
    search?: string
  }
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onFilterChange?: (filters: { status?: string; search?: string }) => void
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return <Badge className="bg-green-500 hover:bg-green-600">Accepted</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
};

const formatAmount = (amount: number) => {
  const sign = amount > 0 ? "+" : "";
  return sign + new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const calculateVolumetricWeight = (length: number | null | undefined, width: number | null | undefined, height: number | null | undefined) => {
  if (!length || !width || !height) return null;
  return (Number(length) * Number(width) * Number(height)) / 5000;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function WeightDisputesDataTable({
  data,
  isLoading,
  pagination,
  filters,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
}: WeightDisputesDataTableProps) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handlePageChange = (newPage: number) => {
    onPageChange?.(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPageSizeChange?.(newPageSize);
    onPageChange?.(1);
  };

  const handleFilterUpdate = React.useCallback((key: string, value: string) => {
    if (!isMounted) return
    onFilterChange?.({ ...filters, [key]: value })
  }, [onFilterChange, filters, isMounted])

  const activeFiltersCount = Object.entries(filters || {}).filter(
    ([key, value]) => value && value !== "ALL" && key !== "search"
  ).length

  const columns = React.useMemo<ColumnDef<WeightDispute>[]>(() => [
    {
      accessorKey: "order",
      header: "Order Details",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm">#{row.original.order?.id?.toString().slice(-8)}</span>
          {/* <span className="text-[10px] font-mono text-muted-foreground uppercase">{row.original.order?.tracking_number}</span> */}
          <span className="text-[10px] text-primary font-bold mt-0.5">{row.original.order?.courier_name}</span>
        </div>
      ),
    },
    {
      accessorKey: "tracking_number",
      header: "AWB",
      cell: ({ row }) => {
        const tracking = row.original.order?.tracking_number;

        return (
          <div className="flex flex-col gap-2">
            {tracking ? (
              <div className="flex items-center gap-1">
                <a
                  href={`https://shiprocket.co/tracking/${tracking}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                  inline-flex items-center
                  text-xs font-mono font-medium
                  text-primary
                  bg-muted
                  hover:bg-primary/10
                  hover:text-primary
                  transition-colors
                  px-3 py-2.5
                  rounded-md
                  
                "
                >
                  {tracking} <HugeiconsIcon icon={LinkCircle02Icon} strokeWidth={2} className="size-3 ml-auto" />
                </a>
                <Button size="icon" className="bg-muted rounded-md" variant="outline" onClick={() => { copy(tracking); sileo.success({ title: "Copied to clipboard", description: "Tracking number copied to clipboard" }) }}><HugeiconsIcon icon={CopyIcon} /></Button>

              </div>
            ) : (
              <span className="text-muted-foreground text-left text-xs">-</span>
              // <></>
            )}


          </div>
        );
      },
    },
    {
      id: "volumetric_weight",
      header: "Volumetric Wt",
      cell: ({ row }) => {
        const volumetricWeight = calculateVolumetricWeight(
          row.original.order?.length,
          row.original.order?.width,
          row.original.order?.height
        );
        return (
          <span className="text-xs font-medium">
            {volumetricWeight ? `${volumetricWeight.toFixed(2)} kg` : "-"}
          </span>
        );
      },
    },
    {
      id: "weight",
      header: "Weight (App/Chg)",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{row.original.applied_weight}kg</span>
          <HugeiconsIcon icon={ArrowRightIcon} size={10} className="text-muted-foreground" />
          <span className="text-xs font-bold text-destructive">{row.original.charged_weight}</span>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const diff = Number(row.original.applied_amount - row.original.charged_amount);
        return (
          <span
            className={`text-xs font-semibold ${diff > 0 ? "text-emerald-600" : "text-destructive"}`}
          >
            {formatAmount(diff)}
          </span>
        );
      },
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
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium">{formatDate(row.original.created_at)}</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(row.original.created_at)}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link href={`/dashboard/weight-mismatch/${row.original.id}`}>
          <Button variant="ghost" size="sm" className="h-8">
            View <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="ml-1" />
          </Button>
        </Link>
      ),
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  React.useEffect(() => {
    if (pagination?.pageSize) {
      table.setPageSize(pagination.pageSize)
    }
  }, [pagination?.pageSize, table])

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Label htmlFor="status-filter" className="sr-only">
            Status
          </Label>
          <Select
            value={filters?.status ?? "ALL"}
            onValueChange={(v) => handleFilterUpdate("status", v ?? "ALL")}
          >
            <SelectTrigger
              className="flex w-fit"
              size="sm"
              id="status-filter"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden w-64 lg:block">
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search disputes..."
              className="pl-9 h-8"
              value={filters?.search ?? ""}
              onChange={(e) => handleFilterUpdate("search", e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" > <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-start" />
                <span className="hidden lg:inline">Columns</span></Button>}
            >
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
        </div>
      </div>

      {(activeFiltersCount > 0 || filters?.search) && (
        <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6">
          {filters?.search && (
            <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
              Search: {filters.search}
              <button onClick={() => handleFilterUpdate("search", "")} className="hover:text-foreground"><HugeiconsIcon icon={Cancel01Icon} className="size-2.5" /></button>
            </Badge>
          )}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all" onClick={() => onFilterChange?.({ status: "ALL", search: "" })}>
              Clear All
            </Button>
          )}
        </div>
      )}

      <div
        className="relative flex flex-col gap-4 px-4 rounded-2xl lg:px-6"
      >
        <div className="overflow-x-auto border rounded-2xl">
          <Table className="min-w-[640px]">
            <TableHeader className="bg-muted sticky top-0 z-10 rounded-2xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8 rounded-2xl">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <HugeiconsIcon icon={Loading03Icon} className="size-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="p-3 bg-muted rounded-full mb-4">
                        <HugeiconsIcon icon={WeightScale01Icon} size={24} className="text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">No Disputes</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        No weight disputes found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 mt-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex tabular-nums">
              Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} of {pagination.total} records
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-xs font-bold uppercase text-muted-foreground">
                  Rows per page
                </Label>
                <Select
                  value={`${pagination.pageSize}`}
                  onValueChange={(value) => handlePageSizeChange(Number(value))}
                >
                  <SelectTrigger size="sm" className="w-20 h-8" id="rows-per-page">
                    <SelectValue placeholder={pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-xs font-bold uppercase text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.currentPage === 1}
                >
                  <span className="sr-only">Go to first page</span>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  <span className="sr-only">Go to last page</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
