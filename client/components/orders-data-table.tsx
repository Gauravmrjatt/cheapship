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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  MoreVerticalCircle01Icon, 
  LeftToRightListBulletIcon, 
  ArrowDown01Icon, 
  Add01Icon, 
  ArrowLeftDoubleIcon, 
  ArrowLeft01Icon, 
  ArrowRight01Icon, 
  ArrowRightDoubleIcon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  DeliveryTruck01Icon,
  SearchIcon,
  FilterIcon,
  Calendar01Icon,
  Cancel01Icon
} from "@hugeicons/core-free-icons"
import { OrderFilters, useCancelOrder } from "@/lib/hooks/use-orders"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { sileo } from "sileo"
import { useQueryClient, useMutation } from "@tanstack/react-query"

const generateManifest = async (orderId: string) => {
  const res = await fetch(`/api/v1/orders/${orderId}/manifest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!res.ok) throw new Error('Failed to generate manifest');
  return res.json();
};

export type Order = {
  id: string
  order_type: string
  shipment_type: string
  payment_mode: string
  total_amount: number
  shipping_charge?: number
  base_shipping_charge?: number
  shipment_status: string
  created_at?: string
  tracking_number?: string
  shiprocket_shipment_id?: string
  courier_name?: string
  label_url?: string
  track_url?: string
  manifest_url?: string
  user?: {
    name: string;
    email: string;
  }
}

const formatPrice = (price: number | string) => {
  return parseFloat(String(price)).toFixed(2);
};

interface OrdersDataTableProps {
  data: Order[]
  isLoading?: boolean
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
    total: number
  }
  filters?: OrderFilters
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onFilterChange?: (filters: OrderFilters) => void
}

export function OrdersDataTable({
  data,
  isLoading,
  pagination,
  filters,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
}: OrdersDataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  
  const cancelOrder = useCancelOrder();
  const queryClient = useQueryClient();

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      sileo.success({ title: "Order cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to cancel order";
      sileo.error({ title: message });
    }
  };

  const columns = React.useMemo<ColumnDef<Order>[]>(() => [
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
      header: "Shipment ID",
      cell: ({ row }) => (
        <Link
          href={`/dashboard/orders/${row.original.id}`}
          className="text-foreground hover:underline font-medium"
        >
          #{row.original.id.slice(0, 8)}
        </Link>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "order_type",
      header: "Type",
      cell: ({ row }) => (
        <div className="w-24">
          <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
            {row.original.order_type}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "shipment_type",
      header: "Service",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
          {row.original.shipment_type}
        </Badge>
      ),
    },
    {
      accessorKey: "payment_mode",
      header: "Payment",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.payment_mode}</span>
      ),
    },
    {
      accessorKey: "total_amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          ₹{formatPrice(row.original.total_amount)}
        </div>
      ),
    },
    // {
    //   accessorKey: "base_shipping_charge",
    //   header: () => <div className="text-right">Base Charge</div>,
    //   cell: ({ row }) => (
    //     <div className="text-right tabular-nums text-muted-foreground">
    //       ₹{(row.original.base_shipping_charge || 0).toLocaleString("en-IN")}
    //     </div>
    //   ),
    // },
    // {
    //   id: "profit",
    //   header: () => <div className="text-right">Profit</div>,
    //   cell: ({ row }) => {
    //     const profit = Number(row.original.shipping_charge || 0) - Number(row.original.base_shipping_charge || 0);
    //     return (
    //       <div className="text-right tabular-nums text-green-600 font-medium">
    //         ₹{profit.toLocaleString("en-IN")}
    //       </div>
    //     );
    //   },
    // },
    {
      accessorKey: "shipment_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.shipment_status.toLowerCase();
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
            {status === "delivered" ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="fill-green-500 dark:fill-green-400 size-3" />
            ) : status === "pending" || status === "processing" ? (
              <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin size-3" />
            ) : (
              <HugeiconsIcon icon={DeliveryTruck01Icon} strokeWidth={2} className="size-3" />
            )}
            {status.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "tracking_number",
      header: "Tracking",
      cell: ({ row }) => {
        const tracking = row.original.tracking_number;
        const trackUrl = row.original.track_url;
        if (!tracking) return <span className="text-muted-foreground text-xs">-</span>;
        return (
          <a 
            href={trackUrl || `https://shiprocket.co/tracking/${tracking}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-mono hover:underline"
          >
            {tracking.slice(0, 12)}...
          </a>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const [isGeneratingManifest, setIsGeneratingManifest] = React.useState(false);
        
        const handleGenerateManifest = async () => {
          setIsGeneratingManifest(true);
          try {
            const result = await generateManifest(row.original.id);
            sileo.success({ title: "Manifest generated successfully" });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to generate manifest";
            sileo.error({ title: message });
          } finally {
            setIsGeneratingManifest(false);
          }
        };
        
        return (
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
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem render={<Link href={`/dashboard/orders/${row.original.id}`} />}>
              View Details
            </DropdownMenuItem>
            {row.original.tracking_number && row.original.track_url && (
              <DropdownMenuItem>
                <a href={row.original.track_url} target="_blank" rel="noopener noreferrer" className="w-full">
                  Track Shipment
                </a>
              </DropdownMenuItem>
            )}
            {row.original.label_url && (
              <DropdownMenuItem>
                <a href={row.original.label_url} target="_blank" rel="noopener noreferrer" className="w-full">
                  Download Label
                </a>
              </DropdownMenuItem>
            )}
            {row.original.shipment_status === "MANIFESTED" && !row.original.manifest_url && (
              <DropdownMenuItem onClick={handleGenerateManifest} disabled={isGeneratingManifest}>
                {isGeneratingManifest ? "Generating..." : "Generate Manifest"}
              </DropdownMenuItem>
            )}
            {row.original.manifest_url && (
              <DropdownMenuItem>
                <a href={row.original.manifest_url} target="_blank" rel="noopener noreferrer" className="w-full">
                  Print Manifest
                </a>
              </DropdownMenuItem>
            )}
            {row.original.shipment_status === "PENDING" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  variant="destructive" 
                  onClick={() => handleCancelOrder(row.original.id)}
                >
                  Cancel Order
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        );
      },
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

  const handleFilterUpdate = (key: keyof OrderFilters, value: string) => {
    onFilterChange?.({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onFilterChange?.({
      order_type: "ALL",
      shipment_status: "ALL",
      payment_mode: "ALL",
      shipment_type: "ALL",
      from: "",
      to: "",
      search: "",
    })
  }

  const activeFiltersCount = Object.entries(filters || {}).filter(
    ([key, value]) => value && value !== "ALL" && key !== "search" && key !== "shipment_status"
  ).length

  return (
    <Tabs
      value={filters?.shipment_status ?? "ALL"}
      onValueChange={(v) => handleFilterUpdate("shipment_status", v ?? "ALL")}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Label htmlFor="status-selector" className="sr-only">
            Status
          </Label>
          <Select
            value={filters?.shipment_status ?? "ALL"}
            onValueChange={(v) => handleFilterUpdate("shipment_status", v ?? "ALL")}
          >
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="status-selector"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">All Orders</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <TabsList className="hidden lg:flex **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
            <TabsTrigger value="ALL">All Orders</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
            <TabsTrigger value="IN_TRANSIT">In Transit</TabsTrigger>
            <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden w-64 lg:block">
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-9 h-8"
              value={filters?.search ?? ""}
              onChange={(e) => handleFilterUpdate("search", e.target.value)}
            />
          </div>

          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" />}>
              <HugeiconsIcon icon={Calendar01Icon} className="size-4" />
              <span className="hidden lg:inline">Date Range</span>
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

          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" />}>
              <HugeiconsIcon icon={FilterIcon} className="size-4" />
              <span className="hidden lg:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 rounded-full px-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 space-y-4" align="end">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Service Layer</Label>
                  <Select value={filters?.shipment_type ?? "ALL"} onValueChange={(v) => handleFilterUpdate("shipment_type", v ?? "ALL")}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Services</SelectItem>
                      <SelectItem value="DOMESTIC">Domestic</SelectItem>
                      <SelectItem value="INTERNATIONAL">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Payment Mode</Label>
                  <Select value={filters?.payment_mode ?? "ALL"} onValueChange={(v) => handleFilterUpdate("payment_mode", v ?? "ALL")}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Payments</SelectItem>
                      <SelectItem value="PREPAID">Prepaid</SelectItem>
                      <SelectItem value="COD">COD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Logistics Protocol</Label>
                  <Select value={filters?.order_type ?? "ALL"} onValueChange={(v) => handleFilterUpdate("order_type", v ?? "ALL")}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Protocols</SelectItem>
                      <SelectItem value="SURFACE">Surface</SelectItem>
                      <SelectItem value="EXPRESS">Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <Button variant="ghost" className="w-full h-8 text-xs text-destructive" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
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
<Link href="/dashboard/orders/new">
          <Button size="sm">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            <span className="hidden lg:inline">New Order</span>
          </Button>
          </Link>
        </div>
      </div>

      {/* Active Filter Chips */}
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
          {filters?.shipment_type !== "ALL" && (
            <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 uppercase">
              {filters?.shipment_type}
              <button onClick={() => handleFilterUpdate("shipment_type", "ALL")} className="hover:text-foreground"><HugeiconsIcon icon={Cancel01Icon} className="size-2.5" /></button>
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
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${pagination?.pageSize || 10}`}
                onValueChange={(value) => {
                  onPageSizeChange?.(Number(value))
                }}
                items={[10, 20, 50].map((pageSize) => ({
                  label: `${pageSize}`,
                  value: `${pageSize}`,
                }))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={pagination?.pageSize || 10}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {pagination?.page || 1} of{" "}
              {pagination?.totalPages || 1}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => onPageChange?.(1)}
                disabled={pagination?.page === 1}
              >
                <span className="sr-only">Go to first page</span>
                <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => onPageChange?.((pagination?.page || 1) - 1)}
                disabled={pagination?.page === 1}
              >
                <span className="sr-only">Go to previous page</span>
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => onPageChange?.((pagination?.page || 1) + 1)}
                disabled={pagination?.page === pagination?.totalPages}
              >
                <span className="sr-only">Go to next page</span>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => onPageChange?.(pagination?.totalPages || 1)}
                disabled={pagination?.page === pagination?.totalPages}
              >
                <span className="sr-only">Go to last page</span>
                <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Tabs>
  )
}
