"use client"
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
import * as React from "react"
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
  FilterIcon,
  Calendar01Icon,
  Cancel01Icon,
  Wallet01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { SecurityDepositFilters } from "@/lib/hooks/use-security-deposits"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { DataTablePagination } from "./orders-table-components"

export type SecurityDeposit = {
  id?: string
  order_id: string
  amount: number
  used_amount: number
  remaining: number
  status: string
  created_at?: string
  order?: {
    shipment_status?: string
  }
}

interface SecurityDepositsDataTableProps {
  data: SecurityDeposit[]
  isLoading?: boolean
  pagination?: {
    currentPage: number
    pageSize: number
    totalPages: number
    total: number
  }
  filters?: SecurityDepositFilters
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onFilterChange?: (filters: SecurityDepositFilters) => void
}

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

export function SecurityDepositsDataTable({
  data,
  isLoading,
  pagination,
  filters,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
}: SecurityDepositsDataTableProps) {
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

  const handleFilterUpdate = React.useCallback((key: keyof SecurityDepositFilters, value: string) => {
    if (!isMounted) return
    onFilterChange?.({ ...filters, [key]: value })
  }, [onFilterChange, filters, isMounted])

  const clearAllFilters = React.useCallback(() => {
    if (!isMounted) return
    onFilterChange?.({
      status: "ALL",
      from: "",
      to: "",
      search: "",
    })
  }, [onFilterChange, isMounted])

  const activeFiltersCount = Object.entries(filters || {}).filter(
    ([key, value]) => value && value !== "ALL" && key !== "search"
  ).length

  const columns = React.useMemo<ColumnDef<SecurityDeposit>[]>(() => [
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
        <span className="text-muted-foreground">{formatDate(row.original.created_at || "")}</span>
      )
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="FULLY_USED">Fully Used</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden w-64 lg:block">
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search deposits..."
              className="pl-9 h-8"
              value={filters?.search ?? ""}
              onChange={(e) => handleFilterUpdate("search", e.target.value)}
            />
          </div>

          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" ><HugeiconsIcon icon={Calendar01Icon} className="size-4" />
              <span className="hidden lg:inline">Date Range</span></Button>}>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Select Date Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase opacity-40">From</Label>
                    <Input
                      type="date"
                      className="h-8"
                      value={filters?.from ?? ""}
                      onChange={(e) => handleFilterUpdate("from", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase opacity-40">To</Label>
                    <Input
                      type="date"
                      className="h-8"
                      value={filters?.to ?? ""}
                      onChange={(e) => handleFilterUpdate("to", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 h-8 text-xs" onClick={() => onFilterChange?.({ ...filters, from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] })}>Today</Button>
                  <Button variant="ghost" className="flex-1 h-8 text-xs" onClick={() => { handleFilterUpdate("from", ""); handleFilterUpdate("to", ""); }}>Reset</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

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

      {(activeFiltersCount > 0 || filters?.search || filters?.from) && (
        <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6">
          {filters?.search && (
            <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
              Search: {filters.search}
              <button onClick={() => handleFilterUpdate("search", "")} className="hover:text-foreground"><HugeiconsIcon icon={Cancel01Icon} className="size-2.5" /></button>
            </Badge>
          )}
          {filters?.from && (
            <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
              Date Applied
              <button onClick={() => { handleFilterUpdate("from", ""); handleFilterUpdate("to", ""); }} className="hover:text-foreground"><HugeiconsIcon icon={Cancel01Icon} className="size-2.5" /></button>
            </Badge>
          )}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all" onClick={clearAllFilters}>
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
                        <HugeiconsIcon icon={Wallet01Icon} size={24} className="text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">No Security Deposits</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your security deposits will appear here when you place orders.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          filteredCount={table.getFilteredRowModel().rows.length}
        />
      </div>
    </div>
  )
}
