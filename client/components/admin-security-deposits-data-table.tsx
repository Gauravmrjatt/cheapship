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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { DataTablePagination } from "./orders-table-components"

export type AdminSecurityDeposit = {
  id: string
  order_id: string
  amount: number
  used_amount: number
  remaining: number
  status: string
  created_at?: string
  order?: {
    shipment_status?: string
  }
  user?: {
    name?: string
    mobile?: string
  }
}

interface AdminSecurityDepositsDataTableProps {
  data: AdminSecurityDeposit[]
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>;
    case 'PARTIAL':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partial</Badge>;
    case 'FULLY_USED':
      return <Badge className="bg-red-100 text-red-700 border-red-200">Fully Used</Badge>;
    case 'REFUNDED':
      return <Badge className="bg-green-100 text-green-700 border-green-200">Refunded</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export function AdminSecurityDepositsDataTable({
  data,
  isLoading,
  pagination,
  filters,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
}: AdminSecurityDepositsDataTableProps) {
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

  const columns = React.useMemo<ColumnDef<AdminSecurityDeposit>[]>(() => [
    {
      accessorKey: "order_id",
      header: "Order ID",
      cell: ({ row }) => (
        <span className="font-medium">#{row.original.order_id.toString()}</span>
      )
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.user?.name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">{row.original.user?.mobile || ''}</span>
        </div>
      )
    },
    {
      accessorKey: "order.shipment_status",
      header: "Order Status",
      cell: ({ row }) => <span>{row.original.order?.shipment_status || '-'}</span>
    },
    {
      accessorKey: "amount",
      header: "Original",
      cell: ({ row }) => <span>{formatCurrency(row.original.amount)}</span>
    },
    {
      accessorKey: "used_amount",
      header: "Used",
      cell: ({ row }) => <span className="text-red-600">-{formatCurrency(row.original.used_amount)}</span>
    },
    {
      accessorKey: "remaining",
      header: "Remaining",
      cell: ({ row }) => <span className="text-green-600 font-medium">{formatCurrency(row.original.remaining)}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatDate(row.original.created_at)}</span>
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
            value={filters?.status ?? ""}
            onValueChange={(v) => handleFilterUpdate("status", v ?? "")}
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
                <SelectItem value="">All Status</SelectItem>
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

      {filters?.search && (
        <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6">
          {filters?.search && (
            <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
              Search: {filters.search}
              <button onClick={() => handleFilterUpdate("search", "")} className="hover:text-foreground"><HugeiconsIcon icon={Cancel01Icon} className="size-2.5" /></button>
            </Badge>
          )}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all" onClick={() => onFilterChange?.({ status: "", search: "" })}>
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
                        No security deposits found
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
