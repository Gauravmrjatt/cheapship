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
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  MoreVerticalCircle01Icon, 
  LeftToRightListBulletIcon, 
  ArrowDown01Icon, 
  ArrowLeftDoubleIcon, 
  ArrowLeft01Icon, 
  ArrowRight01Icon, 
  ArrowRightDoubleIcon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  Cancel01Icon,
  DeliveryTruck01Icon,
  Package01Icon,
  SearchIcon,
} from "@hugeicons/core-free-icons"

export type Order = {
  id: string
  order_type: string
  shipment_type: string
  payment_mode: string
  total_amount: number
  shipment_status: string
  created_at?: string
}

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { icon: React.ReactNode; className: string }> = {
    "delivered": {
      icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="fill-green-500 dark:fill-green-400" />,
      className: "text-green-700 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950",
    },
    "in_transit": {
      icon: <HugeiconsIcon icon={DeliveryTruck01Icon} strokeWidth={2} className="text-blue-500" />,
      className: "text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950",
    },
    "pending": {
      icon: <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="text-yellow-500" />,
      className: "text-yellow-700 border-yellow-200 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950",
    },
    "cancelled": {
      icon: <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="text-red-500" />,
      className: "text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950",
    },
    "processing": {
      icon: <HugeiconsIcon icon={Package01Icon} strokeWidth={2} className="text-purple-500" />,
      className: "text-purple-700 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950",
    },
  }

  const config = statusConfig[status.toLowerCase()] || {
    icon: <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} />,
    className: "text-muted-foreground",
  }

  return (
    <Badge variant="outline" className={`px-2 py-0.5 ${config.className}`}>
      {config.icon}
      <span className="capitalize">{status.replace(/_/g, " ")}</span>
    </Badge>
  )
}

const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
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
      <Link 
        href={`/dashboard/orders/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        #{row.original.id.slice(0, 8)}
      </Link>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "order_type",
    header: "Order Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize">
        {row.original.order_type}
      </Badge>
    ),
  },
  {
    accessorKey: "shipment_type",
    header: "Shipment Type",
    cell: ({ row }) => (
      <Badge variant="secondary" className="px-1.5 capitalize">
        {row.original.shipment_type}
      </Badge>
    ),
  },
  {
    accessorKey: "payment_mode",
    header: "Payment Mode",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.payment_mode}</span>
    ),
  },
  {
    accessorKey: "total_amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        ₹{row.original.total_amount.toLocaleString("en-IN")}
      </div>
    ),
  },
  {
    accessorKey: "shipment_status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.shipment_status),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="data-open:bg-muted text-muted-foreground flex size-8"
              size="icon"
            />
          }
        >
          <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem render={<Link href={`/dashboard/orders/${row.original.id}`} />}>
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem>Track Order</DropdownMenuItem>
          <DropdownMenuItem>Download Invoice</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Cancel Order</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

interface OrdersDataTableProps {
  data: Order[]
  isLoading?: boolean
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
    total: number
  }
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function OrdersDataTable({
  data,
  isLoading,
  pagination,
  onPageChange,
  onPageSizeChange,
}: OrdersDataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <HugeiconsIcon 
              icon={SearchIcon} 
              strokeWidth={2} 
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" 
            />
            <Input
              placeholder="Search orders..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} data-icon="inline-start" />
              Columns
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" render={<Link href="/dashboard/orders/new" />}>
            Create Order
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {pagination?.total || table.getFilteredRowModel().rows.length} order(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${pagination?.pageSize || 10}`}
              onValueChange={(value) => {
                onPageSizeChange?.(Number(value))
              }}
              items={[10, 20, 30, 40, 50].map((pageSize) => ({
                label: `${pageSize}`,
                value: `${pageSize}`,
              }))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={pagination?.pageSize || 10} />
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
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {pagination?.page || 1} of {pagination?.totalPages || 1}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange?.(1)}
              disabled={!pagination || pagination.page === 1}
            >
              <span className="sr-only">Go to first page</span>
              <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => onPageChange?.((pagination?.page || 1) - 1)}
              disabled={!pagination || pagination.page === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => onPageChange?.((pagination?.page || 1) + 1)}
              disabled={!pagination || pagination.page === pagination.totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => onPageChange?.(pagination?.totalPages || 1)}
              disabled={!pagination || pagination.page === pagination.totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
