"use client";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { TableSkeleton } from "@/components/skeletons";
import { useQuery } from "@tanstack/react-query";
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
} from "@tanstack/react-table";
import { useAdminOrders, useAdminCancelOrder, useAdminGenerateLabel, AdminOrder } from "@/lib/hooks/use-admin";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { sileo } from "sileo";
import {
  SearchIcon,
  Loading03Icon,
  CheckmarkCircle01Icon,
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  FilterIcon,
  ArrowDown01Icon,
  DeliveryTruck01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Add01Icon,
  MoreVerticalCircle01Icon,
  LayoutIcon,
  MapPinIcon,
  Download02Icon,
  LinkCircle02Icon,
  Location01Icon,
  UserIcon,
  Mail01Icon,
  SmartPhone01Icon,
  AlertCircleIcon,
  CopyIcon,
  PackageSentIcon,
  PackageOutOfStockIcon,
  DeliveryView01Icon
} from "@hugeicons/core-free-icons";

import copy from 'copy-to-clipboard';

interface AdminOrderFilters {
  shipment_status: string;
  search: string;
  shipment_type: string;
  payment_mode: string;
  order_type: string;
  from: string;
  to: string;
}

import { ShipmentStatus } from "@/components/ui/status-chip"
function OrdersContent() {
  const searchParams = useSearchParams();

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [filters, setFilters] = React.useState<AdminOrderFilters>({
    shipment_status: "ALL",
    search: "",
    shipment_type: "ALL",
    payment_mode: "ALL",
    order_type: "ALL",
    from: "",
    to: "",
  });
  const [userIdFilter, setUserIdFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isMounted, setIsMounted] = React.useState(false);
  const [showPickupDialog, setShowPickupDialog] = React.useState(false);
  const [selectedPickupLocation, setSelectedPickupLocation] = React.useState<string | null>(null);

  const cancelOrder = useAdminCancelOrder();
  const generateLabel = useAdminGenerateLabel();
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
    queryKey: ["admin-pickup-locations"],
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

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isMounted) return;
    const userIdFromQuery = searchParams.get("userId") || "";
    const statusFromQuery = searchParams.get("shipment_status") || "";

    if (userIdFromQuery) {
      setUserIdFilter(userIdFromQuery);
    }

    if (statusFromQuery) {
      setFilters(prev => ({ ...prev, shipment_status: statusFromQuery }));
    }
  }, [searchParams, isMounted]);

  const { data, isLoading } = useAdminOrders(
    page,
    pageSize,
    filters.shipment_status,
    filters.search,
    userIdFilter,
    filters.shipment_type,
    filters.payment_mode,
    filters.order_type,
    filters.from,
    filters.to
  );

  const handleFilterUpdate = React.useCallback((key: keyof AdminOrderFilters, value: string) => {
    if (!isMounted) return;
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, [isMounted]);

  const handleStatusChange = (status: string | null) => {
    if (status) {
      handleFilterUpdate("shipment_status", status);
    }
  };

  const clearAllFilters = React.useCallback(() => {
    if (!isMounted) return;
    setFilters({
      shipment_status: "ALL",
      search: "",
      shipment_type: "ALL",
      payment_mode: "ALL",
      order_type: "ALL",
      from: "",
      to: "",
    });
    setPage(1);
  }, [isMounted]);

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && value !== "ALL" && key !== "search" && key !== "shipment_status"
  ).length;

  const tableData = React.useMemo(() => data?.data || [], [data?.data]);

  const handleCancelOrder = React.useCallback(async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync(orderId);
    } catch {
      // Error handled in mutation
    }
  }, [cancelOrder]);

  const handleGenerateLabel = React.useCallback(async (orderId: string) => {
    try {
      await generateLabel.mutateAsync(orderId);
    } catch {
      // Error handled in mutation
    }
  }, [generateLabel]);

  const columns = React.useMemo<ColumnDef<AdminOrder>[]>(() => [
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
          <div className="flex gap-3 items-center">
            <Link
              href={`/dashboard/orders/${row.original.id}`}
              className="text-foreground hover:underline font-medium"
            >
              #{row.original.id}
            </Link>
            <Button size="icon" variant="outline" onClick={() => { copy(row.original.id); sileo.success({ title: "Copied to clipboard", description: "Order ID copied to clipboard" }) }}><HugeiconsIcon icon={CopyIcon} /></Button>
          </div>
          {row.original.shiprocket_order_id && (<span className="text-[10px]  tabular-nums">
            {row.original.shiprocket_order_id ? `OID :   ${row.original.shiprocket_order_id}` : "-"}
          </span>)}
          {row.original.shiprocket_shipment_id && (<span className="text-[10px]  tabular-nums">
            {row.original.shiprocket_shipment_id ? `Shipment ID :  ${row.original.shiprocket_shipment_id}` : "-"}
          </span>)}
          <span className="text-[10px]  tabular-nums">
            {row.original.created_at ? new Date(row.original.created_at).toLocaleString() : "-"}
          </span>

        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "user",
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
          </div>
        );
      },
    },
    // {
    //   accessorKey: "order_type",
    //   header: "Type",
    //   cell: ({ row }) => (
    //     <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
    //       {row.original.order_type}
    //     </Badge>
    //   ),
    // },
    // {
    //   accessorKey: "shipment_type",
    //   header: "Service",
    //   cell: ({ row }) => (
    //     <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
    //       {row.original.shipment_type}
    //     </Badge>
    //   ),
    // },
    {
      id: "routing",
      header: "Routing",
      cell: ({ row }) => {
        const pickup = row.original.order_pickup_address;
        const receiver = row.original.order_receiver_address;

        if (!pickup || !receiver) return <span className="text-muted-foreground text-xs">-</span>;

        return (
          <div className="flex flex-col-reverse gap-2">
            <Popover>
              <PopoverTrigger render={
                <div className="flex flex-col items-center cursor-help hover:text-primary transition-colors max-w-[150px] text-center">
                  <span className="font-semibold text-foreground text-xs truncate text-center">{pickup.city}, {pickup.state}</span>
                  <span className="text-[10px] text-muted-foreground truncate text-center">to {receiver.city}, {receiver.state}</span>
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
                variant="outline"
                size="sm"
                className="text-primary gap-1 h-7 px-2 mt-1"
                onClick={() => handleOpenPickupDialog(row.original.pickup_location!)}
              >
                <HugeiconsIcon icon={Location01Icon} className="h-3 w-3" />
                <span className="text-xs font-medium truncate max-w-[100px]">{row.original.pickup_location}</span>
              </Button>
            )}
          </div>
        );
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
        <div className="text-right tabular-nums font-bold text-xs">
          ₹{Number(row.original.total_amount).toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      accessorKey: "cod_amount",
      header: () => <div className="text-right">COD</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.payment_mode === "COD" && row.original.cod_amount ? `₹${Number(row.original.cod_amount).toLocaleString("en-IN")}` : "-"}
        </div>
      ),
    },
    {
      accessorKey: "shipment_status",
      header: "Status",
      cell: ({ row }) => {
        const order = row.original;
        const status = order.shipment_status.toLowerCase();

        return (
          <ShipmentStatus status={status} />
        );
      },
    },
    {
      accessorKey: "tracking_number",
      header: "AWB & Label",
      cell: ({ row }) => {
        const tracking = row.original.tracking_number;
        const trackUrl = row.original.track_url;
        const isAbsoluteUrl = (url: string): boolean => /^https?:\/\//i.test(url);

        const labelUrl: string = row.original.label_url ? (isAbsoluteUrl(row.original.label_url || "")
          ? row.original.label_url || ""
          : BASE_URL + row.original.label_url || "") : "";

        return (
          <div className="flex flex-col gap-2">
            {tracking ? (
              <div className="flex items-center gap-1">
                <a
                  href={trackUrl || `https://shiprocket.co/tracking/${tracking}`}
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
                  w-full
                "
                >
                  {tracking} <HugeiconsIcon icon={LinkCircle02Icon} strokeWidth={2} className="size-3 ml-auto" />
                </a>     <Button size="icon" className="bg-muted rounded-md" variant="outline" onClick={() => { copy(tracking); sileo.success({ title: "Copied to clipboard", description: "Tracking number copied to clipboard" }) }}><HugeiconsIcon icon={CopyIcon} /></Button>

              </div>
            ) : (
              <span className="text-muted-foreground text-left text-xs">-</span>
              // <></>
            )}

            {labelUrl && labelUrl !== null && (
              <a
                href={labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
          
          text-xs font-medium
          text-foreground
          bg-muted
          border border-border
          hover:bg-muted
          hover:text-foreground
          transition-colors
          px-2 py-2
          rounded-md
          w-full
          text-center gap-4
          flex items-center
        "
              >

                <HugeiconsIcon
                  icon={Download02Icon}
                  className=" size-5 "
                />
                Download Label
              </a>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "courier_name",
      header: "Courier",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium">{order.courier_name || "N/A"}</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
                {row.original.order_type}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
                {row.original.shipment_type}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        const isPending = order.shipment_status === "PENDING";
        const hasLabel = !!order.label_url;

        return (
          <DropdownMenu>
            <ButtonGroup>
              {order.is_draft ? (
                <Button render={<Link href={`/dashboard/orders/new?id=${order.id}`} />} variant="secondary" className="font-bold text-primary">
                  <HugeiconsIcon className="bg-muted mr-1" icon={PackageSentIcon} strokeWidth={2} /> Ship Now
                </Button>
              ) : (
                <Button render={<Link href={`/dashboard/orders/${order.id}`} />} variant="secondary" className="font-bold text-primary">
                  <HugeiconsIcon className="" icon={DeliveryView01Icon} strokeWidth={2} />View Now
                </Button>
              )}
              <ButtonGroupSeparator />
              <DropdownMenuTrigger
                render={
                  <Button variant="secondary">
                    <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                    <span className="sr-only">Open menu</span>
                  </Button>
                }
              >
              </DropdownMenuTrigger>
            </ButtonGroup>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem render={<Link href={`/dashboard/orders/${order.id}`} />}>
                <HugeiconsIcon className="mr-2" icon={DeliveryView01Icon} strokeWidth={2} />View Details
              </DropdownMenuItem>

              {order.tracking_number && order.track_url && (
                <DropdownMenuItem>
                  <a href={order.track_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center">
                    <HugeiconsIcon className="mr-2" icon={DeliveryTruck01Icon} strokeWidth={2} />Track Shipment
                  </a>
                </DropdownMenuItem>
              )}
              {hasLabel ? (
                <DropdownMenuItem>
                  <a
                    href={
                      /^https?:\/\//i.test(order.label_url || "")
                        ? order.label_url
                        : `${BASE_URL}${order.label_url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center"
                  >
                    <HugeiconsIcon className="mr-2" icon={Download02Icon} strokeWidth={2} />Download Label
                  </a>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleGenerateLabel(order.id)}
                  disabled={generateLabel.isPending}
                >
                  <HugeiconsIcon className="mr-2" icon={Download02Icon} strokeWidth={2} />{generateLabel.isPending ? "Generating..." : "Generate Label"}
                </DropdownMenuItem>
              )}
              {order.is_draft && (
                <DropdownMenuItem render={<Link href={`/dashboard/orders/new?id=${order.id}`} />}>
                  <HugeiconsIcon className="mr-2" icon={PackageSentIcon} strokeWidth={2} /><span className="text-primary font-bold">Ship Now</span>
                </DropdownMenuItem>
              )}
              {(order.shipment_status === "PENDING" || order.is_draft) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelOrder.isPending}
                  >
                    <HugeiconsIcon className="mr-2" icon={PackageOutOfStockIcon} strokeWidth={2} /> {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [handleCancelOrder, handleGenerateLabel, cancelOrder.isPending, generateLabel.isPending]);

  const table = useReactTable({
    data: tableData,
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
  });

  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

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
    sileo.success({ title: `Exported ${selectedRows.length} orders` });
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
    <div className="w-full space-y-0 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 ">
        <p className="text-muted-foreground">
          {userIdFilter
            ? `Viewing orders for user ID: ${userIdFilter}`
            : ""}
        </p>
      </div>

      <Tabs
        value={filters.shipment_status}
        onValueChange={handleStatusChange}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-4">
            <Select value={filters.shipment_status} onValueChange={handleStatusChange}>
              <SelectTrigger className="flex w-fit" size="sm">
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
                value={filters.search}
                onChange={(e) => handleFilterUpdate("search", e.target.value)}
              />
            </div>

            <Popover>
              <PopoverTrigger>
                <Button variant="outline" className="">
                  <HugeiconsIcon icon={Calendar01Icon} className="size-4" />
                  <span className="hidden lg:inline">Date Range</span>
                </Button>
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
                        value={filters.from}
                        onChange={(e) => handleFilterUpdate("from", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase opacity-40">To</Label>
                      <Input
                        type="date"
                        className="h-8"
                        value={filters.to}
                        onChange={(e) => handleFilterUpdate("to", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1 h-8 text-xs" onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      handleFilterUpdate("from", today);
                      handleFilterUpdate("to", today);
                    }}>Today</Button>
                    <Button variant="ghost" className="flex-1 h-8 text-xs" onClick={() => {
                      handleFilterUpdate("from", "");
                      handleFilterUpdate("to", "");
                    }}>Reset</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger>
                <Button variant="outline" size="sm" className="">  <HugeiconsIcon icon={FilterIcon} className="size-4" />
                  <span className="hidden lg:inline">Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 rounded-full px-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 space-y-4" align="end">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Service Layer</Label>
                    <Select value={filters.shipment_type} onValueChange={(v) => handleFilterUpdate("shipment_type", v ?? "ALL")}>
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
                    <Select value={filters.payment_mode} onValueChange={(v) => handleFilterUpdate("payment_mode", v ?? "ALL")}>
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
                    <Select value={filters.order_type} onValueChange={(v) => handleFilterUpdate("order_type", v ?? "ALL")}>
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
              <DropdownMenuTrigger>
                <Button variant="outline" size="sm" className="">  <HugeiconsIcon icon={LayoutIcon} strokeWidth={2} data-icon="inline-start" />
                  <span className="hidden lg:inline">Columns</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
                </Button>
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



            {/* <Link href="/dashboard/orders/new">
              <Button size="sm">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                <span className="hidden lg:inline">New Order</span>
              </Button>
            </Link> */}
          </div>
        </div>

        {(activeFiltersCount > 0 || filters.search || filters.from) && (
          <div className="flex flex-wrap items-center gap-2 ">
            {filters.search && (
              <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
                Search: {filters.search}
                <button onClick={() => handleFilterUpdate("search", "")} className="hover:text-foreground"><HugeiconsIcon icon={Cancel01Icon} className="size-2.5" /></button>
              </Badge>
            )}
            {filters.from && (
              <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
                Date Applied
                <button onClick={() => { handleFilterUpdate("from", ""); handleFilterUpdate("to", ""); }} className="hover:text-foreground"><HugeiconsIcon icon={Cancel01Icon} className="size-2.5" /></button>
              </Badge>
            )}
            {filters.shipment_type !== "ALL" && (
              <Badge variant="secondary" className="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 uppercase">
                {filters.shipment_type}
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

        <div className="relative flex flex-col gap-4 ">
          <div className="overflow-x-auto border rounded-2xl">
            <Table className="min-w-[900px]">
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
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between ">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex items-center justify-baseline gap-4">
              <div>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {data?.pagination?.total || 0} orders selected
              </div>
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-8 px-3 py-2 border shadow-sm">
                      <HugeiconsIcon icon={LayoutIcon} className="size-4" />
                      <span className="hidden lg:inline">Bulk Actions</span>
                      <Badge className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[10px]">{table.getFilteredSelectedRowModel().rows.length}</Badge>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCSV}>Export CSV</DropdownMenuItem>
                    {/* <DropdownMenuItem onClick={handleBulkLabels}>Download Labels</DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
                <Select value={`${pageSize}`} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[10, 20, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {page} of {data?.pagination?.totalPages || 1}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(1)} disabled={page === 1}>
                  <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(p => Math.min(data?.pagination?.totalPages || 1, p + 1))} disabled={page === (data?.pagination?.totalPages || 1)}>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(data?.pagination?.totalPages || 1)} disabled={page === (data?.pagination?.totalPages || 1)}>
                  <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
                </Button>
              </div>
            </div>
          </div>
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
                          <p className="font-medium text-sm ">{matchingPickup.email}</p>
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
                  The pickup location &quot;{selectedPickupLocation}&quot; was not found in saved locations.
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
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="w-full space-y-6 py-4">
        <TableSkeleton rowCount={10} columnCount={7} />
      </div>
    }>
      <OrdersContent />

    </Suspense>
  );
}
