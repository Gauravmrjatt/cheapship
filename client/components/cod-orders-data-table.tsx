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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LeftToRightListBulletIcon,
  ArrowDown01Icon,
  Loading03Icon,
  SearchIcon,
  Location01Icon,
  Calendar01Icon,
  MoneyReceiveCircleIcon,
  MapPinIcon,
  ArrowDownDoubleIcon,
  PackageSentIcon,
  PackageReceiveIcon,
  PackageIcon
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { DataTablePagination } from "./orders-table-components"
import { CODStatsCards, RemittanceDialog } from "./cod-orders-table-components"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

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
  shiprocket_order_id?: string
  shiprocket_shipment_id?: string
  tracking_number?: string
  user: {
    id: string
    name: string
    email: string
    upi_id?: string
    mobile?: string
  }
  order_receiver_address?: {
    name: string
    city: string
    state: string
  }
}

export interface CODUserGroup {
  user: {
    id: string
    name: string
    email: string
    upi_id?: string
    mobile?: string
    bank_name?: string
    beneficiary_name?: string
    account_number?: string
    ifsc_code?: string
  }
  order_count: number
  total_cod_amount: number
  total_remitted_amount: number
  pending_amount: number
  remittance_status: string
  orders?: {
    id: string
    cod_amount: number
    shipment_status: string
    created_at: string
    tracking_number?: string
  }[]
  order_pickup_address?: {
    name: string
    address?: string
    city: string
    state: string
    pincode: string
    phone?: string
  }
  order_receiver_address?: {
    name: string
    address?: string
    city: string
    state: string
    pincode: string
    phone?: string
  }
  pickup_location?: string
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
  const [paymentMethod, setPaymentMethod] = React.useState<"UPI" | "BANK">("UPI")
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
    const totalAmount = Number(order.cod_amount) || 0;
    const commission = totalAmount * 0.02;
    const remittedAmount = totalAmount - commission;
    
    setSelectedOrder(order)
    setRemittanceForm({
      remittance_status: order.remittance_status || "REMITTED",
      payout_status: order.payout_status || "PENDING",
      remitted_amount: remittedAmount.toString(),
      remittance_ref_id: `₹${Math.round(remittedAmount)}`,
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
      remittance_payment_method: paymentMethod,
    })
    setShowDialog(false)
    setSelectedOrder(null)
  }

  const columns = React.useMemo<ColumnDef<CODOrder>[]>(() => [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <Link
            href={`/dashboard/orders/${row.original.id}`}
            className="text-foreground hover:underline font-medium"
          >
            #{row.original.id}
          </Link>

          <span className="text-[10px]  tabular-nums">
            {row.original.shiprocket_order_id ? `Shiprocket OID :   ${row.original.shiprocket_order_id}` : "-"}
          </span>
          <span className="text-[10px]  tabular-nums">
            {row.original.shiprocket_shipment_id ? `Shiprocket Ship ID :  ${row.original.shiprocket_shipment_id}` : "-"}
          </span>

          <span className="text-[10px]  tabular-nums">
            {row.original.created_at ? new Date(row.original.created_at).toLocaleString() : "-"}
          </span>

        </div>
      ),
      enableHiding: false,
    },
    {
      id: "tracking",
      header: "Tracking",
      cell: ({ row }) => {
        const tracking = row.original.tracking_number;
        return (
          <div className="flex flex-col">
            {tracking ? (
              <a
                href={`/track?awb=${tracking}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono font-medium text-primary hover:underline"
              >
                {tracking}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      id: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">{user?.name}</span>
            <span className="text-[10px] text-muted-foreground">{user?.email}</span>
            {user?.mobile && (
              <span className="text-[10px] text-blue-600 font-medium">{user.mobile}</span>
            )}
            {user?.upi_id && (
              <span className="text-[10px] text-blue-600 font-medium">{user.upi_id}</span>
            )}
          </div>
        );
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

  React.useEffect(() => {
    if (pagination?.pageSize) {
      table.setPageSize(pagination.pageSize)
    }
  }, [pagination?.pageSize, table])

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
        selectedOrder={selectedOrder as any}
        remittanceForm={remittanceForm}
        setRemittanceForm={setRemittanceForm}
        onUpdate={handleUpdate}
        isUpdating={isUpdating}
      />
    </Tabs>
  )
}

interface CODUserGroupsDataTableProps {
  data: CODUserGroup[]
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
  onUpdateRemittance?: (userGroup: CODUserGroup, data: { remittance_status: string; payout_status?: string; remitted_amount?: number; remittance_ref_id?: string }) => void
  isUpdating?: boolean
}

const statusConfigGroup: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  PROCESSING: { label: "Processing", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  REMITTED: { label: "Remitted", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export function CODUserGroupsDataTable({
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
}: CODUserGroupsDataTableProps) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedUserGroup, setSelectedUserGroup] = React.useState<CODUserGroup | null>(null)
  const [showDialog, setShowDialog] = React.useState(false)
  const [showOrdersDialog, setShowOrdersDialog] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [paymentMethod, setPaymentMethod] = React.useState<"UPI" | "BANK">("UPI")
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

  const openDialog = (userGroup: CODUserGroup) => {
    const totalAmount = Number(userGroup.total_cod_amount) || 0;
    const commission = totalAmount * 0.02;
    const remittedAmount = totalAmount - commission;
    
    setSelectedUserGroup(userGroup)
    setRemittanceForm({
      remittance_status: userGroup.remittance_status || "REMITTED",
      payout_status: "PENDING",
      remitted_amount: remittedAmount.toString(),
      remittance_ref_id: `₹${Math.round(remittedAmount)}`,
    })
    setShowDialog(true)
  }

  const openOrdersDialog = (userGroup: CODUserGroup) => {
    setSelectedUserGroup(userGroup)
    setShowOrdersDialog(true)
  }

  const handleUpdate = () => {
    if (!selectedUserGroup) return
    onUpdateRemittance?.(selectedUserGroup, {
      remittance_status: remittanceForm.remittance_status,
      payout_status: remittanceForm.payout_status,
      remitted_amount: parseFloat(remittanceForm.remitted_amount) || undefined,
      remittance_ref_id: remittanceForm.remittance_ref_id || undefined,
      remittance_payment_method: paymentMethod,
    })
    setShowDialog(false)
    setSelectedUserGroup(null)
  }

  const columns = React.useMemo<ColumnDef<CODUserGroup>[]>(() => [
    {
      id: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{user?.name || "Unknown"}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            {user?.mobile && (
              <span className="text-xs text-blue-600 font-medium">{user.mobile}</span>
            )}
            {user?.upi_id && (
              <span className="text-xs text-green-600">{user.upi_id}</span>
            )}
            {user?.bank_name && (
              <span className="text-xs text-green-600">{user.bank_name} - A/C: XXXX{user.account_number?.slice(-4)}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "order_count",
      header: "Orders",
      cell: ({ row }) => (
        <button
          onClick={() => openOrdersDialog(row.original)}
          className="font-medium text-primary hover:underline cursor-pointer"
        >
          {row.original.order_count} order{row.original.order_count !== 1 ? 's' : ''}
        </button>
      ),
    },
    {
      id: "routing",
      header: () => <div className="text-center">Routing</div>,
      cell: ({ row }) => {
        const pickup = row.original.order_pickup_address;
        const receiver = row.original.order_receiver_address;
        if (!pickup || !receiver) return <span className="text-muted-foreground text-xs">-</span>;
        return (
          <div className="flex flex-col-reverse gap-2">
            <Popover>
              <PopoverTrigger render={
                <div className="flex flex-col items-center cursor-help hover:text-primary transition-colors text-center">
                  <span className="font-semibold flex text-foreground text-xs truncate text-center">
                    <HugeiconsIcon icon={PackageSentIcon} className="size-4 mr-1.5 text-orange-400" />
                    {pickup.name}, {pickup.city}, {pickup.state} - {pickup.pincode}
                  </span>
                  <span className="text-[10px] flex items-center justify-center text-muted-foreground truncate text-center my-1">
                    <HugeiconsIcon className="size-5 text-lime-400" icon={ArrowDownDoubleIcon} />
                  </span>
                  <span className="text-[10px] flex text-muted-foreground truncate text-center">
                    <HugeiconsIcon icon={PackageReceiveIcon} className="size-4 mr-1.5 text-violet-400" />
                    {receiver.name}, {receiver.city}, {receiver.state} - {receiver.pincode}
                  </span>
                </div>
              } />
              <PopoverContent className="w-72 p-3" side="right">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground mb-1">
                      <HugeiconsIcon icon={MapPinIcon} className="size-3" />
                      Sender
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="font-medium">{pickup.name}</p>
                      {pickup.address && <p>{pickup.address}</p>}
                      <p>{pickup.city}, {pickup.state} - {pickup.pincode}</p>
                      {pickup.phone && <p className="text-blue-600 font-medium">{pickup.phone}</p>}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground mb-1">
                      <HugeiconsIcon icon={MapPinIcon} className="size-3" />
                      Receiver
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="font-medium">{receiver.name}</p>
                      {receiver.address && <p>{receiver.address}</p>}
                      <p>{receiver.city}, {receiver.state} - {receiver.pincode}</p>
                      {receiver.phone && <p className="text-blue-600 font-medium">{receiver.phone}</p>}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {row.original?.pickup_location && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary gap-1 h-7 px-2 mt-1"
              >
                <HugeiconsIcon icon={Location01Icon} className="h-3 w-3" />
                <span className="text-xs font-medium truncate max-w-[100px]">{row.original.pickup_location}</span>
              </Button>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: "total_cod_amount",
      header: () => <div className="text-right">Total COD</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold">
          {formatCurrency(row.original.total_cod_amount)}
        </div>
      ),
    },
    {
      accessorKey: "total_remitted_amount",
      header: () => <div className="text-right">Remitted</div>,
      cell: ({ row }) => (
        <div className="text-right text-green-600 font-medium">
          {formatCurrency(row.original.total_remitted_amount)}
        </div>
      ),
    },
    {
      accessorKey: "pending_amount",
      header: () => <div className="text-right">Pending</div>,
      cell: ({ row }) => (
        <div className="text-right text-yellow-600 font-medium">
          {formatCurrency(row.original.pending_amount)}
        </div>
      ),
    },
    {
      accessorKey: "remittance_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.remittance_status
        const config = statusConfigGroup[status] || { label: status, className: "" }
        return (
          <Badge variant="secondary" className={cn("text-xs capitalize", config.className)}>
            {config.label}
          </Badge>
        )
      },
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
          Update All
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

  React.useEffect(() => {
    if (pagination?.pageSize) {
      table.setPageSize(pagination.pageSize)
    }
  }, [pagination?.pageSize, table])

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
                placeholder="Search user..."
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
                    No COD user groups found.
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={MoneyReceiveCircleIcon} size={20} />
              Update Remittance for All Orders
            </DialogTitle>
            <DialogDescription>
              {selectedUserGroup?.user?.name} - {selectedUserGroup?.order_count} orders - Total COD: {formatCurrency(selectedUserGroup?.total_cod_amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(selectedUserGroup?.user?.upi_id || selectedUserGroup?.user?.bank_name) && (
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "UPI" | "BANK")} className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    {selectedUserGroup?.user?.upi_id && <TabsTrigger value="UPI">UPI</TabsTrigger>}
                    {selectedUserGroup?.user?.bank_name && <TabsTrigger value="BANK">Bank Transfer</TabsTrigger>}
                  </TabsList>
                  {selectedUserGroup?.user?.upi_id && (
                    <TabsContent value="UPI" className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg flex flex-col items-center justify-center gap-2">
                        <Image
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${selectedUserGroup.user.upi_id}&am=${Math.round(Number(selectedUserGroup?.total_cod_amount || 0) * 0.98)}`)}`}
                          alt="UPI QR Code"
                          width={120}
                          height={120}
                          className="rounded-md shadow-sm bg-white p-2"
                        />
                        <p className="text-xs font-medium text-center">{selectedUserGroup.user.upi_id}</p>
                        <p className="text-[10px] text-muted-foreground text-center">Amount after 2% deduction: {formatCurrency(Number(selectedUserGroup?.total_cod_amount || 0) * 0.98)}</p>
                      </div>
                    </TabsContent>
                  )}
                  {selectedUserGroup?.user?.bank_name && (
                    <TabsContent value="BANK" className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bank:</span>
                          <span className="font-medium">{selectedUserGroup.user.bank_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Beneficiary:</span>
                          <span className="font-medium">{selectedUserGroup.user.beneficiary_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account:</span>
                          <span className="font-medium">XXXX{selectedUserGroup.user.account_number?.slice(-4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IFSC:</span>
                          <span className="font-medium">{selectedUserGroup.user.ifsc_code}</span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                          <span>Amount to Transfer:</span>
                          <span className="text-green-600">{formatCurrency(Number(selectedUserGroup?.total_cod_amount || 0) * 0.98)}</span>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted">
              <div className="flex justify-between text-sm">
                <span>Total COD Amount:</span>
                <span className="font-medium">{formatCurrency(selectedUserGroup?.total_cod_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Admin Commission (2%):</span>
                <span className="font-medium">-{formatCurrency((Number(selectedUserGroup?.total_cod_amount) || 0) * 0.02)}</span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                <span>User Will Receive:</span>
                <span className="text-green-600">{formatCurrency((Number(selectedUserGroup?.total_cod_amount) || 0) * 0.98)}</span>
              </div>
            </div>

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

            <div className="space-y-2">
              <Label>Payout Status (To User)</Label>
              <Select
                value={remittanceForm.payout_status}
                onValueChange={(v) => { if (v) setRemittanceForm(prev => ({ ...prev, payout_status: v })) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
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
                "Update All Orders"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrdersDialog} onOpenChange={setShowOrdersDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={PackageIcon} size={20} />
              Orders for {selectedUserGroup?.user?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedUserGroup?.order_count} orders - Total COD: {formatCurrency(selectedUserGroup?.total_cod_amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedUserGroup?.orders?.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex flex-col">
                  <span className="font-medium">Order #{order.id}</span>
                  {order.tracking_number && (
                    <span className="text-xs text-muted-foreground">{order.tracking_number}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-medium">{formatCurrency(order.cod_amount)}</span>
                  <Badge variant="outline" className="text-xs">
                    {order.shipment_status}
                  </Badge>
                </div>
              </div>
            ))}
            {(!selectedUserGroup?.orders || selectedUserGroup.orders.length === 0) && (
              <p className="text-center text-muted-foreground py-4">No orders found</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrdersDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
