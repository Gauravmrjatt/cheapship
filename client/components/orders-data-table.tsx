"use client"
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MoreVerticalCircle01Icon,
  LayoutIcon,
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
  Cancel01Icon,
  MapPinIcon,
  FileDownloadIcon,
  LinkCircle02Icon,
  Location01Icon,
  UserIcon,
  Mail01Icon,
  SmartPhone01Icon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons"
import { OrderFilters, useCancelOrder } from "@/lib/hooks/use-orders"
import { useAuth } from "@/lib/hooks/use-auth"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { sileo } from "sileo"
import { useQueryClient } from "@tanstack/react-query"
import { ActionsCell, DataTablePagination } from "./orders-table-components"

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
  cod_amount?: number
  is_draft?: boolean
  order_pickup_address?: {
    name: string;
    phone?: string;
    address?: string;
    city: string;
    state: string;
    country?: string;
    pincode?: string;
  }
  order_receiver_address?: {
    name: string;
    phone?: string;
    address?: string;
    city: string;
    state: string;
    country?: string;
    pincode?: string;
  }
  pickup_location?: string
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
    currentPage: number
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
  const [isMounted, setIsMounted] = React.useState(false)
  const [showPickupDialog, setShowPickupDialog] = React.useState(false)
  const [selectedPickupLocation, setSelectedPickupLocation] = React.useState<string | null>(null)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const cancelOrder = useCancelOrder();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  interface PickupLocation {
    id: string;
    pickup_location: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pin_code: string;
  }

  const { data: pickupLocationsData, isLoading: isLoadingPickupLocations } = useQuery({
    queryKey: ["pickup-locations"],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/addresses/pickup`, {
        headers: {
          "Authorization": `Bearer ${token || ""}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) throw new Error("Failed to fetch pickup locations");
      return response.json();
    },
    enabled: !!token && showPickupDialog
  });

  const matchingPickup = pickupLocationsData?.data?.shipping_address?.find(
    (loc: PickupLocation) => loc.pickup_location === selectedPickupLocation
  );

  const handleOpenPickupDialog = (pickupLocation: string) => {
    setSelectedPickupLocation(pickupLocation);
    setShowPickupDialog(true);
  };

  const handleCancelOrder = React.useCallback(async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      sileo.success({ title: "Order cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to cancel order";
      sileo.error({ title: message });
    }
  }, [cancelOrder, queryClient]);

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
        <div className="flex flex-col gap-1">
          <Link
            href={`/dashboard/orders/${row.original.id}`}
            className="text-foreground hover:underline font-medium"
          >
            #{row.original.id.slice(0, 8)}
          </Link>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {row.original.created_at ? new Date(row.original.created_at).toLocaleString() : "-"}
          </span>
        </div>
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
      id: "addresses",
      header: "Routing",
      cell: ({ row }) => {
        const pickup = row.original.order_pickup_address;
        const receiver = row.original.order_receiver_address;
        if (!pickup || !receiver) return <span className="text-muted-foreground text-xs">-</span>;
        return (
          <>
            <Popover>
              <PopoverTrigger render={
                <div className="flex flex-col items-start cursor-help hover:text-primary transition-colors max-w-[150px]">
                  <span className="font-semibold text-foreground text-xs truncate">{pickup.city}, {pickup.state}</span>
                  <span className="text-[10px] text-muted-foreground truncate">to {receiver.city}, {receiver.state}</span>
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
                onClick={() => handleOpenPickupDialog(row.original.pickup_location!)}
              >
                <HugeiconsIcon icon={Location01Icon} className="h-3 w-3" />
                <span className="text-xs font-medium truncate max-w-[100px]">{row.original.pickup_location}</span>
              </Button>
            )}
          </>
        )
      }
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
    {
      accessorKey: "cod_amount",
      header: () => <div className="text-right">COD</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.payment_mode === "COD" && row.original.cod_amount ? `₹${formatPrice(row.original.cod_amount)}` : "-"}
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
        const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
          delivered: { label: 'Delivered', icon: CheckmarkCircle01Icon, color: 'text-green-500' },
          pending: { label: 'Pending', icon: Loading03Icon, color: 'text-yellow-500' },
          processing: { label: 'Processing', icon: Loading03Icon, color: 'text-blue-500' },
          manifested: { label: 'Manifested', icon: DeliveryTruck01Icon, color: 'text-orange-500' },
          out_for_pickup: { label: 'Out for Pickup', icon: DeliveryTruck01Icon, color: 'text-purple-500' },
          picked_up: { label: 'Picked Up', icon: DeliveryTruck01Icon, color: 'text-purple-600' },
          in_transit: { label: 'In Transit', icon: DeliveryTruck01Icon, color: 'text-blue-500' },
          out_for_delivery: { label: 'Out for Delivery', icon: DeliveryTruck01Icon, color: 'text-indigo-500' },
          dispatched: { label: 'Dispatched', icon: DeliveryTruck01Icon, color: 'text-indigo-600' },
          cancelled: { label: 'Cancelled', icon: Cancel01Icon, color: 'text-red-500' },
          rto: { label: 'RTO', icon: MapPinIcon, color: 'text-red-600' },
          not_picked: { label: 'Not Picked', icon: Cancel01Icon, color: 'text-red-400' }
        };
        
        const config = statusConfig[status] || { label: status.replace(/_/g, ' '), icon: DeliveryTruck01Icon, color: 'text-gray-500' };
        
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
            <HugeiconsIcon icon={config.icon} strokeWidth={2} className={`${config.color} size-3`} />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "tracking_number",
      header: "AWB & Label",
      cell: ({ row }) => {
        const tracking = row.original.tracking_number;
        const trackUrl = row.original.track_url;
        const labelUrl = BASE_URL + row.original.label_url;

        return (
          <div className="flex flex-col gap-2">
            {tracking ? (
              <a
                href={trackUrl || `https://shiprocket.co/tracking/${tracking}`}
                target="_blank"
                rel="noopener noreferrer"
                className="
              inline-flex items-center
              text-xs font-mono font-medium
              text-primary
              bg-primary/10
              hover:bg-primary/20
              hover:text-primary
              transition-colors
              px-2 py-1
              rounded-md
              w-full
            "
              >
                {tracking} <HugeiconsIcon icon={LinkCircle02Icon} strokeWidth={2} className="size-3 ml-auto" />
              </a>
            ) : (
              <span className="text-muted-foreground text-center text-xs">-</span>
            )}

            {labelUrl && (
              <a
                href={labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
      inline-flex items-center
      text-xs font-medium
      text-foreground
      bg-muted/40
      border border-border
      hover:bg-muted
      hover:text-foreground
      transition-colors
      px-2 py-2
      rounded-xl
      w-full
    "
              >
                Label
                <HugeiconsIcon
                  icon={FileDownloadIcon}
                  className="ml-auto size-3 text-muted-foreground"
                />
              </a>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <ActionsCell row={row} handleCancelOrder={handleCancelOrder} />,
    },
  ], [handleCancelOrder]);

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

  const handlePageChange = (newPage: number) => {
    onPageChange?.(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPageSizeChange?.(newPageSize);
    onPageChange?.(1);
  };

  const handleFilterUpdate = React.useCallback((key: keyof OrderFilters, value: string) => {
    if (!isMounted) return
    onFilterChange?.({ ...filters, [key]: value })
  }, [onFilterChange, filters, isMounted])

  const clearAllFilters = React.useCallback(() => {
    if (!isMounted) return
    onFilterChange?.({
      order_type: "ALL",
      shipment_status: "ALL",
      payment_mode: "ALL",
      shipment_type: "ALL",
      from: "",
      to: "",
      search: "",
    })
  }, [onFilterChange, isMounted])

  const activeFiltersCount = Object.entries(filters || {}).filter(
    ([key, value]) => value && value !== "ALL" && key !== "search" && key !== "shipment_status"
  ).length

  const handleExportCSV = React.useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows.map(r => r.original);
    if (selectedRows.length === 0) return;

    const headers = ["Order ID", "Date", "Service", "Protocol", "Payment", "Amount", "COD", "Status", "AWB", "Pickup City", "Receiver City"];
    const csvContent = [
      headers.join(","),
      ...selectedRows.map(row => [
        row.id,
        row.created_at ? new Date(row.created_at).toLocaleString() : "",
        row.shipment_type,
        row.order_type,
        row.payment_mode,
        row.total_amount,
        row.cod_amount || 0,
        row.shipment_status,
        row.tracking_number || "",
        row.order_pickup_address?.city || "",
        row.order_receiver_address?.city || ""
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cheapship_orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [table]);

  const handleBulkLabels = React.useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows.map(r => r.original);
    const labelUrls = selectedRows.map(r => r.label_url).filter(Boolean);

    if (labelUrls.length === 0) {
      sileo.error({ title: "No labels found for selected orders." });
      return;
    }

    sileo.info({ title: `Opening ${labelUrls.length} labels in new tabs... Ensure popups are allowed.` });

    labelUrls.forEach((url, i) => {
      setTimeout(() => {
        window.open(url, "_blank");
      }, i * 300);
    });
  }, [table]);

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
              className="flex w-fit"
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
                <SelectItem value="MANIFESTED">Manifested</SelectItem>
                <SelectItem value="OUT_FOR_PICKUP">Out for Pickup</SelectItem>
                <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="RTO">RTO</SelectItem>
                <SelectItem value="NOT_PICKED">Not Picked</SelectItem>
                <SelectItem value="DRAFT">Drafts</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
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

          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" > <HugeiconsIcon icon={FilterIcon} className="size-4" />
              <span className="hidden lg:inline">Filters</span></Button>}>

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
              render={<Button variant="outline" size="sm" > <HugeiconsIcon icon={LayoutIcon} strokeWidth={2} data-icon="inline-start" />
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
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" variant="secondary" className="gap-2 border shadow-sm" />}>
                <HugeiconsIcon icon={LayoutIcon} className="size-4" />
                <span className="hidden lg:inline">Bulk Actions</span>
                <Badge className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[10px]">{table.getFilteredSelectedRowModel().rows.length}</Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkLabels}>Download Labels</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

        <DataTablePagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          filteredCount={table.getFilteredRowModel().rows.length}
        />
      </div>

      <Dialog open={showPickupDialog} onOpenChange={setShowPickupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Location01Icon} className="h-5 w-5 text-primary" />
              Pickup Location Details
            </DialogTitle>
            <DialogDescription>
              Complete address information for {selectedPickupLocation}
            </DialogDescription>
          </DialogHeader>

          {isLoadingPickupLocations ? (
            <div className="space-y-4 py-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ) : matchingPickup ? (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <HugeiconsIcon icon={MapPinIcon} className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Location Name</p>
                    <p className="font-semibold">{matchingPickup.pickup_location}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HugeiconsIcon icon={UserIcon} className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Contact Person</p>
                    <p className="font-semibold">{matchingPickup.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <HugeiconsIcon icon={SmartPhone01Icon} className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                      <p className="font-medium text-sm">{matchingPickup.phone}</p>
                    </div>
                  </div>

                  {matchingPickup.email && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
                        <p className="font-medium text-sm">{matchingPickup.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Full Address</p>
                    <p className="font-medium text-sm">{matchingPickup.address}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {matchingPickup.city}, {matchingPickup.state} - {matchingPickup.pin_code}
                    </p>
                    <p className="text-sm text-muted-foreground">{matchingPickup.country}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <HugeiconsIcon icon={AlertCircleIcon} className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No pickup location details found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                The pickup location &quot;{selectedPickupLocation}&quot; was not found in your saved locations.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowPickupDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
