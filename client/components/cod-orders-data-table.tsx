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
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  LeftToRightListBulletIcon, 
  ArrowDown01Icon, 
  ArrowLeftDoubleIcon, 
  ArrowLeft01Icon, 
  ArrowRight01Icon, 
  ArrowRightDoubleIcon,
  Loading03Icon,
  SearchIcon,
  Location01Icon,
  Calendar01Icon,
  MoneyReceiveCircleIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface CODOrder {
  id: string
  order_type: string
  shipment_status: string
  payment_mode: string
  cod_amount: number
  remittance_status: string
  remitted_amount: number | null
  remitted_at: string | null
  remittance_ref_id: string | null
  created_at: string
  user: {
    id: string
    name: string
    email: string
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
  }
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onFilterChange?: (filters: { status: string; search: string }) => void
  onUpdateRemittance?: (order: CODOrder, data: { remittance_status: string; remitted_amount?: number; remittance_ref_id?: string }) => void
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
  const [remittanceForm, setRemittanceForm] = React.useState({
    remittance_status: "REMITTED",
    remitted_amount: "",
    remittance_ref_id: "",
  })

  const handleFilterUpdate = (key: string, value: string) => {
    onFilterChange?.({ ...(filters as any), [key]: value })
  }

  const openDialog = (order: CODOrder) => {
    setSelectedOrder(order)
    setRemittanceForm({
      remittance_status: order.remittance_status || "REMITTED",
      remitted_amount: order.cod_amount?.toString() || "",
      remittance_ref_id: order.remittance_ref_id || "",
    })
    setShowDialog(true)
  }

  const handleUpdate = () => {
    if (!selectedOrder) return
    onUpdateRemittance?.(selectedOrder, {
      remittance_status: remittanceForm.remittance_status,
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
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-col gap-4">
        {summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">Pending Remittance</p>
              {isLoading ? (
                <div className="h-7 w-32 bg-muted animate-pulse rounded mt-1" />
              ) : (
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPendingCOD)}</p>
              )}
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">Total Remitted</p>
              {isLoading ? (
                <div className="h-7 w-32 bg-muted animate-pulse rounded mt-1" />
              ) : (
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRemitted)}</p>
              )}
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">Total COD Orders</p>
              {isLoading ? (
                <div className="h-7 w-20 bg-muted animate-pulse rounded mt-1" />
              ) : (
                <p className="text-2xl font-bold">{pagination?.total || 0}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              value={filters?.status ?? "ALL"}
              onValueChange={(v) => { if (v) { handleFilterUpdate("status", v); onPageChange?.(1) }}}
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

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
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

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {pagination?.total || 0} total orders
          </div>
          
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
              <Select
                value={`${pagination?.pageSize || 10}`}
                onValueChange={(value) => onPageSizeChange?.(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={pagination?.pageSize || 10} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => onPageChange?.(1)}
                disabled={pagination?.currentPage === 1}
              >
                <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => onPageChange?.((pagination?.currentPage || 1) - 1)}
                disabled={pagination?.currentPage === 1}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => onPageChange?.((pagination?.currentPage || 1) + 1)}
                disabled={pagination?.currentPage === pagination?.totalPages}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => onPageChange?.(pagination?.totalPages || 1)}
                disabled={pagination?.currentPage === pagination?.totalPages}
              >
                <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={MoneyReceiveCircleIcon} size={20} />
              Update Remittance Status
            </DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id?.slice(0, 8)} - COD Amount: {formatCurrency(selectedOrder?.cod_amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Remittance Status</Label>
              <Select
                value={remittanceForm.remittance_status}
                onValueChange={(v) => { if (v) setRemittanceForm(prev => ({ ...prev, remittance_status: v })) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="REMITTED">Remitted</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {remittanceForm.remittance_status === "REMITTED" && (
              <>
                <div className="space-y-2">
                  <Label>Remitted Amount</Label>
                  <Input
                    type="number"
                    value={remittanceForm.remitted_amount}
                    onChange={(e) => setRemittanceForm(prev => ({ ...prev, remitted_amount: e.target.value }))}
                    placeholder="Enter remitted amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference ID (Optional)</Label>
                  <Input
                    value={remittanceForm.remittance_ref_id}
                    onChange={(e) => setRemittanceForm(prev => ({ ...prev, remittance_ref_id: e.target.value }))}
                    placeholder="Transaction reference ID"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" size={16} />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
