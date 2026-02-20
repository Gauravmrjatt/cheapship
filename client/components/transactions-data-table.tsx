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
import { Checkbox } from "@/components/ui/checkbox"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  LeftToRightListBulletIcon, 
  ArrowDown01Icon, 
  ArrowLeftDoubleIcon, 
  ArrowLeft01Icon, 
  ArrowRight01Icon, 
  ArrowRightDoubleIcon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  SearchIcon,
  Cancel01Icon,
  MoneyReceiveCircleIcon,
  MoneySendCircleIcon,
  InformationSquareIcon,
  Wallet01Icon,
  PackageIcon,
  Delete02Icon,
  DeliveryIcon,
  Coins01Icon
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Transaction } from "@/lib/hooks/use-transactions"
import { DateRangePicker } from "@/components/ui/date-picker"

interface TransactionsDataTableProps {
  data: Transaction[]
  isLoading?: boolean
  showUserColumn?: boolean
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
    total: number
  }
  filters?: {
    type: string
    category: string
    search: string
    fromDate?: string
    toDate?: string
  }
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onFilterChange?: (filters: { type: string; category: string; search: string; fromDate?: string; toDate?: string }) => void
}

const categoryLabels: Record<string, { label: string; icon: typeof Wallet01Icon }> = {
  WALLET_TOPUP: { label: "Wallet Topup", icon: Wallet01Icon },
  ORDER_PAYMENT: { label: "Order Payment", icon: PackageIcon },
  REFUND: { label: "Refund", icon: Delete02Icon },
  COD_REMITTANCE: { label: "COD Remittance", icon: DeliveryIcon },
  COMMISSION: { label: "Commission", icon: Coins01Icon },
}

export function TransactionsDataTable({
  data,
  isLoading,
  showUserColumn = false,
  pagination,
  filters,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
}: TransactionsDataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    user: showUserColumn
  })
  const [sorting, setSorting] = React.useState<SortingState>([])

  React.useEffect(() => {
    setColumnVisibility(prev => ({ ...prev, user: showUserColumn }));
  }, [showUserColumn]);

  const columns = React.useMemo<ColumnDef<Transaction>[]>(() => [
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
      header: "Transaction ID",
      cell: ({ row }) => (
        <span className="text-foreground font-medium uppercase">
          #{row.original.id.slice(0, 8)}
        </span>
      ),
      enableHiding: false,
    },
    {
      id: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) return null;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-xs">{user.name}</span>
            <span className="text-[10px] text-muted-foreground">{user.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="w-24">
          <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
            <HugeiconsIcon 
              icon={row.original.type === "CREDIT" ? MoneyReceiveCircleIcon : MoneySendCircleIcon} 
              size={12} 
              strokeWidth={2}
              className={cn(row.original.type === "CREDIT" ? "text-green-500" : "text-red-500")}
            />
            {row.original.type.toLowerCase()}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category;
        const config = categoryLabels[category] || { label: category, icon: Wallet01Icon };
        return (
          <Badge variant="secondary" className="text-xs gap-1.5 capitalize">
            <HugeiconsIcon icon={config.icon} size={12} strokeWidth={2} />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="flex flex-col max-w-[200px]">
          <span className="text-xs font-medium truncate">{row.original.description}</span>
          {row.original.reference_id && <span className="text-[9px] text-muted-foreground font-mono">Ref: {row.original.reference_id}</span>}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status.toLowerCase();
        const statusReason = row.original.status_reason;
        const statusContent = (
          <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
            {status === "success" ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="fill-green-500 dark:fill-green-400 size-3" />
            ) : status === "pending" ? (
              <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin size-3" />
            ) : (
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="text-red-500 size-3" />
            )}
            {status}
          </Badge>
        );
        
        if (statusReason) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    {statusContent}
                    <HugeiconsIcon icon={InformationSquareIcon} size={14} className="text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[200px] text-xs">{statusReason}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        
        return statusContent;
      },
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className={cn(
          "text-right tabular-nums font-medium",
          row.original.type === "CREDIT" ? "text-green-600" : "text-red-600"
        )}>
          {row.original.type === "CREDIT" ? "+" : "-"}₹{Number(row.original.amount).toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleFilterUpdate = (key: string, value: string | undefined) => {
    onFilterChange?.({ ...(filters as any), [key]: value })
  }

  const handleDateChange = (fromDate?: Date, toDate?: Date) => {
    onFilterChange?.({
      ...(filters as any),
      fromDate: fromDate?.toISOString().split('T')[0],
      toDate: toDate?.toISOString().split('T')[0],
    })
  }

  return (
    <Tabs
      value={filters?.category ?? "ALL"}
      onValueChange={(v) => handleFilterUpdate("category", v === "ALL" ? undefined : v)}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              value={filters?.category ?? "ALL"}
              onValueChange={(v) => handleFilterUpdate("category", v === "ALL" ? undefined : v)}
            >
              <SelectTrigger className="flex w-fit lg:hidden" size="sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="WALLET_TOPUP">Wallet Topup</SelectItem>
                <SelectItem value="ORDER_PAYMENT">Orders</SelectItem>
                <SelectItem value="REFUND">Refunds</SelectItem>
                <SelectItem value="COD_REMITTANCE">COD Remittance</SelectItem>
                <SelectItem value="COMMISSION">Commission</SelectItem>
              </SelectContent>
            </Select>

            <TabsList className="hidden lg:flex **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="WALLET_TOPUP">Wallet</TabsTrigger>
              <TabsTrigger value="ORDER_PAYMENT">Orders</TabsTrigger>
              <TabsTrigger value="REFUND">Refunds</TabsTrigger>
              <TabsTrigger value="COD_REMITTANCE">COD</TabsTrigger>
              <TabsTrigger value="COMMISSION">Commission</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2">
            <DateRangePicker
              fromDate={filters?.fromDate ? new Date(filters.fromDate) : undefined}
              toDate={filters?.toDate ? new Date(filters.toDate) : undefined}
              onFromDateChange={(d) => handleDateChange(d, filters?.toDate ? new Date(filters.toDate) : undefined)}
              onToDateChange={(d) => handleDateChange(filters?.fromDate ? new Date(filters.fromDate) : undefined, d)}
              className="hidden lg:flex"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={filters?.type ?? "ALL"}
              onValueChange={(v) => handleFilterUpdate("type", v === "ALL" ? undefined : v)}
            >
              <SelectTrigger className="w-28" size="sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="CREDIT">Credits</SelectItem>
                <SelectItem value="DEBIT">Debits</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9 h-8"
                value={filters?.search ?? ""}
                onChange={(e) => handleFilterUpdate("search", e.target.value || undefined)}
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

      <div className="relative flex flex-col gap-4 px-4 lg:px-6">
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
                    <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {pagination?.total || 0} row(s) selected.
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
              Page {pagination?.page || 1} of {pagination?.totalPages || 1}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => onPageChange?.(1)}
                disabled={pagination?.page === 1}
              >
                <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => onPageChange?.((pagination?.page || 1) - 1)}
                disabled={pagination?.page === 1}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => onPageChange?.((pagination?.page || 1) + 1)}
                disabled={pagination?.page === pagination?.totalPages}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => onPageChange?.(pagination?.totalPages || 1)}
                disabled={pagination?.page === pagination?.totalPages}
              >
                <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Tabs>
  )
}
