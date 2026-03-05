"use client"

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
import {
  Select,
  SelectContent,
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LeftToRightListBulletIcon,
  ArrowDown01Icon,
  Loading03Icon,
  SearchIcon,
  Location01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { DataTablePagination } from "./orders-table-components"
import { CODStatsCards, RemittanceDialog } from "./cod-orders-table-components"

export interface CODOrder {
  id: string
  order_type: string
  shipment_status: string
  payment_mode: string
  cod_amount: number
  remittance_status: string
  payout_status: string
  remitted_amount: number | null
  remitted_at: string | null
  remittance_ref_id: string | null
  created_at: string
  user: {
    id: string
    name: string
    email: string
    upi_id?: string
  }
  order_receiver_address?: {
    name: string
    city: string
    state: string
  }
}

interface CODOrdersDataTableProps {
  data: CODOrder[]
  isLoading?: boolean
  pagination?: {
    currentPage: number
    pageSize: number
    totalPages: number
    total: number
  }
  summary?: {
    totalPendingCOD: number
    totalRemitted: number
  }
  filters?: {
    status: string
    search: string
    order_source: string
  }
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onFilterChange?: (filters: { status: string; search: string; order_source: string }) => void
  onUpdateRemittance?: (order: CODOrder, data: { remittance_status: string; payout_status?: string; remitted_amount?: number; remittance_ref_id?: string }) => void
  isUpdating?: boolean
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  PROCESSING: { label: "Processing", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  REMITTED: { label: "Remitted", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  NOT_APPLICABLE: { label: "N/A", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return "-"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function CODOrdersDataTable({
  data,
  isLoading,
  pagination,
  summary,
  filters,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
  onUpdateRemittance,
  isUpdating,
}: CODOrdersDataTableProps) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedOrder, setSelectedOrder] = React.useState<CODOrder | null>(null)
  const [showDialog, setShowDialog] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [remittanceForm, setRemittanceForm] = React.useState({
    remittance_status: "REMITTED",
    payout_status: "PENDING",
    remitted_amount: "",
    remittance_ref_id: "",
  })

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleFilterUpdate = React.useCallback((key: string, value: string) => {
    if (!isMounted) return
    onFilterChange?.({ ...(filters as any), [key]: value })
  }, [filters, onFilterChange, isMounted])

  const openDialog = (order: CODOrder) => {
    setSelectedOrder(order)
    setRemittanceForm({
      remittance_status: order.remittance_status || "REMITTED",
      payout_status: order.payout_status || "PENDING",
      remitted_amount: order.cod_amount?.toString() || "",
      remittance_ref_id: order.remittance_ref_id || "",
    })
    setShowDialog(true)
  }

  const handleUpdate = () => {
    if (!selectedOrder) return
    onUpdateRemittance?.(selectedOrder, {
      remittance_status: remittanceForm.remittance_status,
      payout_status: remittanceForm.payout_status,
      remitted_amount: parseFloat(remittanceForm.remitted_amount) || undefined,
      remittance_ref_id: remittanceForm.remittance_ref_id || undefined,
    })
    setShowDialog(false)
    setSelectedOrder(null)
  }

  const columns = React.useMemo<ColumnDef<CODOrder>[]>(() => [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <span className="text-foreground font-medium">
          #{row.original.id.slice(0, 8)}
        </span>
      ),
      enableHiding: false,
    },
    {
      id: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user
        if (!user) return null
        return (
          <div className="flex flex-col">
            <span className="font-medium text-xs">{user.name}</span>
            <span className="text-[10px] text-muted-foreground">{user.email}</span>
          </div>
        )
      },
    },
    {
      id: "receiver",
      header: "Receiver",
      cell: ({ row }) => {
        const addr = row.original.order_receiver_address
        if (!addr) return "-"
        return (
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
            <div>
              <p className="text-xs">{addr.name}</p>
              <p className="text-[10px] text-muted-foreground">{addr.city}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "cod_amount",
      header: () => <div className="text-right">COD Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold">
          {formatCurrency(row.original.cod_amount)}
        </div>
      ),
    },
    {
      accessorKey: "remittance_status",
      header: "Remittance",
      cell: ({ row }) => {
        const status = row.original.remittance_status
        const config = statusConfig[status] || { label: status, className: "" }
        return (
          <Badge variant="secondary" className={cn("text-xs capitalize", config.className)}>
            {config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "payout_status",
      header: "Payout",
      cell: ({ row }) => {
        const status = row.original.payout_status || "PENDING"
        return (
          <Badge variant="secondary" className={cn("text-xs capitalize", status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300")}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "remitted_amount",
      header: () => <div className="text-right">Remitted</div>,
      cell: ({ row }) => (
        <div className="text-right text-green-600 font-medium">
          {formatCurrency(row.original.remitted_amount)}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Order Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <HugeiconsIcon icon={Calendar01Icon} size={14} />
          {formatDate(row.original.created_at)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDialog(row.original)}
        >
          Update
        </Button>
      ),
      enableHiding: false,
    },
  ], [])

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

  return (
    <Tabs
      value={filters?.status ?? "ALL"}
      onValueChange={(v) => { handleFilterUpdate("status", v); onPageChange?.(1) }}
      className="w-full flex-col justify-start gap-6 overflow-hidden"
    >
      <div className="flex flex-col gap-4 overflow-hidden">
        <CODStatsCards summary={summary} totalOrders={pagination?.total} isLoading={isLoading} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            <Select
              value={filters?.status ?? "ALL"}
              onValueChange={(v) => { if (v) { handleFilterUpdate("status", v); onPageChange?.(1) } }}
            >
              <SelectTrigger className="flex w-fit lg:hidden" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="REMITTED">Remitted</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <TabsList className="hidden lg:flex">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
              <TabsTrigger value="REMITTED">Remitted</TabsTrigger>
              <TabsTrigger value="FAILED">Failed</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <div className="hidden md:flex bg-muted/60 p-1 rounded-lg">
              <Button variant={filters?.order_source === "ALL" ? "secondary" : "ghost"} size="sm" onClick={() => { handleFilterUpdate("order_source", "ALL"); onPageChange?.(1); }} className="h-7 text-xs px-3 shadow-none">All</Button>
              <Button variant={filters?.order_source === "USER_ORDERS" ? "secondary" : "ghost"} size="sm" onClick={() => { handleFilterUpdate("order_source", "USER_ORDERS"); onPageChange?.(1); }} className="h-7 text-xs px-3 shadow-none">User COD</Button>
              <Button variant={filters?.order_source === "MY_ORDERS" ? "secondary" : "ghost"} size="sm" onClick={() => { handleFilterUpdate("order_source", "MY_ORDERS"); onPageChange?.(1); }} className="h-7 text-xs px-3 shadow-none">My Orders</Button>
            </div>
            <div className="relative w-full sm:w-64 min-w-[150px]">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-8"
                value={filters?.search ?? ""}
                onChange={(e) => { handleFilterUpdate("search", e.target.value); onPageChange?.(1) }}
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
          </div>
        </div>
      </div>

      <div className="relative flex flex-col gap-4">
        <div className="overflow-x-auto border rounded-2xl">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted sticky top-0 z-10">
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
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
                    No COD orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          filteredCount={table.getFilteredRowModel().rows.length}
        />
      </div>

      <RemittanceDialog 
        open={showDialog}
        onOpenChange={setShowDialog}
        selectedOrder={selectedOrder}
        remittanceForm={remittanceForm}
        setRemittanceForm={setRemittanceForm}
        onUpdate={handleUpdate}
        isUpdating={isUpdating}
      />
    </Tabs>
  )
}
