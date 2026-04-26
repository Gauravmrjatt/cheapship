"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrder, useLiveOrderStatus, useAssignAWB, useSchedulePickup, useGenerateLabel } from "@/lib/hooks/use-order";
import { useCancelOrder } from "@/lib/hooks/use-orders";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderDetailSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RefreshIcon,
  PackageIcon,
  DeliveryTruck01Icon,
  Location01Icon,
  LinkCircle02Icon as ExternalLinkIcon,
  CheckmarkCircle01Icon,
  CircleDot,
  Clock01Icon as ClockIcon,
  Add01Icon,
  ShippingTruck01Icon,
  Calendar01Icon,
  Cancel01Icon,
  AlertCircleIcon,
  UserIcon,
  Mail01Icon,
  SmartPhone01Icon,
  MapPinIcon,
  CopyIcon,
  ArrowUpIcon,
  TruckDeliveryIcon
} from "@hugeicons/core-free-icons";

import copy from "copy-to-clipboard";
import { sileo } from "sileo";
import { ShipmentStatus } from "@/components/ui/status-chip";
import { formatDate, formatDateForPickup } from "@/lib/date";
const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500",
  MANIFESTED: "bg-blue-500",
  IN_TRANSIT: "bg-orange-500",
  OUT_FOR_DELIVERY: "bg-purple-500",
  DISPATCHED: "bg-indigo-500",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-500",
  NOT_PICKED: "bg-gray-500",
  RTO: "bg-red-700",
};


interface TrackingActivity {
  status: string;
  location?: string;
  date?: string;
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = React.use(params);
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);
  const { data: liveStatus, isLoading: liveStatusLoading, refetch: refetchLiveStatus } = useLiveOrderStatus(orderId, !!order?.shiprocket_shipment_id);

  const assignAWBMutation = useAssignAWB();
  const schedulePickupMutation = useSchedulePickup();
  const generateLabelMutation = useGenerateLabel();
  const cancelOrderMutation = useCancelOrder();
  const { token } = useAuth();

  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [showPickupDialog, setShowPickupDialog] = React.useState(false);
  const [showSchedulePickupDialog, setShowSchedulePickupDialog] = React.useState(false);
  const [selectedPickupDate, setSelectedPickupDate] = React.useState<Date | undefined>(undefined);

  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());

  const { data: pickupLocationsData, isLoading: isLoadingPickupLocations } = useQuery({
    queryKey: ["pickup-locations", orderId],
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
    enabled: !!order?.pickup_location && showPickupDialog && !!token
  });

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

  const matchingPickup = pickupLocationsData?.data?.shipping_address?.find(
    (loc: PickupLocation) => loc.pickup_location === order?.pickup_location
  );

  React.useEffect(() => {
    if (liveStatus) {
      setLastUpdated(new Date());
    }
  }, [liveStatus]);

  const handleRefresh = () => {
    refetch();
    refetchLiveStatus();
  };

  const handleAssignAWB = () => {
    assignAWBMutation.mutate({ orderId });
  };

  const handleSchedulePickup = (): void => {
    const pickupDate: string | undefined = selectedPickupDate
      ? formatDateForPickup(selectedPickupDate)
      : undefined;

    schedulePickupMutation.mutate({
      orderId,
      pickup_date: pickupDate,
    });

    setShowSchedulePickupDialog(false);
    setSelectedPickupDate(undefined);
  };


  const handleGenerateLabel = () => {
    generateLabelMutation.mutate({ orderId });
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      await cancelOrderMutation(orderId);
      refetch();
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Failed to cancel order:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) return <OrderDetailSkeleton />;
  if (isError) return <div className="max-w-7xl mx-auto py-10 px-4">Error fetching order details</div>;
  if (!order) return <div className="max-w-7xl mx-auto py-10 px-4">Order not found</div>;

  const isDelivered = order.shipment_status === "DELIVERED";
  const isCancelled = order.shipment_status === "CANCELLED";
  const hasAWB = !!order.tracking_number;
  const isPending = order.shipment_status === "PENDING";
  const isManifested = order.shipment_status === "MANIFESTED";
  const isCancellable = (isPending || isManifested) || order.is_draft;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground">Order ID: #{orderId}</p>
        </div>
        <div className="flex gap-2">
          {isPending && !order.tracking_number && (
            <Button
              onClick={handleAssignAWB}
              disabled={assignAWBMutation.isPending}
              className="rounded-xl font-bold gap-2"
            >
              {assignAWBMutation.isPending ? <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin" /> : <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />}
              Assign AWB
            </Button>
          )}

          {hasAWB && !order.label_url && (
            <Button
              onClick={handleGenerateLabel}
              disabled={generateLabelMutation.isPending}
              variant="outline"
              className="rounded-xl font-bold gap-2"
            >
              {generateLabelMutation.isPending ? <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin" /> : <HugeiconsIcon icon={PackageIcon} className="h-4 w-4" />}
              Generate Label
            </Button>
          )}

          {hasAWB && !order.pickup_scheduled_date && (
            <Button
              onClick={() => setShowSchedulePickupDialog(true)}
              disabled={schedulePickupMutation.isPending}
              variant="secondary"
              className="rounded-xl font-bold gap-2"
            >
              {schedulePickupMutation.isPending ? <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin" /> : <HugeiconsIcon icon={ShippingTruck01Icon} className="h-4 w-4" />}
              Schedule Pickup
            </Button>
          )}

          {isCancellable && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="rounded-xl font-bold gap-2"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
              Cancel Order
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={liveStatusLoading} className="rounded-xl">
            <HugeiconsIcon icon={RefreshIcon} className={`h-4 w-4 ${liveStatusLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order Information</CardTitle>

              <ShipmentStatus status={order.shipment_status} />

            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="flex gap-3">
              <div >
                <p className="text-xs font-medium text-muted-foreground uppercase">Order ID</p>
                <p className="font-semibold">#{order.id}</p>
              </div>

              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  copy(order.id);
                  sileo.success({
                    title: "Copied to clipboard",
                    description: "Order ID copied to clipboard"
                  });
                }}
              >
                <HugeiconsIcon icon={CopyIcon} />
              </Button> {/* <Button size="icon" variant="outline" onClick={() => { copy(order.id, {  onCopy: () => sileo.success({ title: "Copied to clipboard", description: "Order ID copied to clipboard" }) }) }}><HugeiconsIcon icon={CopyIcon} /></Button> */}
            </div>

            <div className="flex gap-3">
              <div >
                <p className="text-xs font-medium text-muted-foreground uppercase">Courier Order ID</p>
                <p className="font-mono text-sm">{order.shiprocket_order_id || "-"}</p>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  copy(order.shiprocket_order_id);
                  sileo.success({
                    title: "Copied to clipboard",
                    description: "Courier Order ID copied to clipboard"
                  })
                }}
              >
                <HugeiconsIcon icon={CopyIcon} />
              </Button>
            </div>

            <div className="flex gap-3">
              <div >
                <p className="text-xs font-medium text-muted-foreground uppercase">Shipment ID</p>
                <p className="font-mono text-sm">{order.shiprocket_shipment_id || "-"}</p>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  copy(order.shiprocket_shipment_id || "-");
                  sileo.success({
                    title: "Copied to clipboard",
                    description: "Shipment ID copied to clipboard"
                  })
                }}
              >
                <HugeiconsIcon icon={CopyIcon} />
              </Button>
            </div>

            <div className="flex gap-3">
              <div >
                <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                  Tracking Number
                </p>
                <p className="font-mono text-sm">{order.tracking_number || "-"}</p>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  copy(order.tracking_number || "-");
                  sileo.success({
                    title: "Copied to clipboard",
                    description: "Tracking Number copied to clipboard"
                  })
                }}
              >
                <HugeiconsIcon icon={CopyIcon} />
              </Button>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Shipping Amount</p>
              <p className="font-semibold">₹{order.shipment_status === "DRAFT" ? <>0</> : order.total_amount}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Product Value</p>
              <p className="font-semibold">₹{order.shipment_status === "DRAFT" ? <>0</> : (order as any).productValue || 0}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Order Type</p>
              <p className="font-semibold">{order.order_type}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Service Type</p>
              <p className="font-semibold">{order.shipment_type}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Payment</p>
              <p className="font-semibold">{order.payment_mode}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Courier</p>
              <p className="font-semibold">{order.courier_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Order Date</p>
              <p className="font-semibold">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <HugeiconsIcon icon={Calendar01Icon} size={12} />
                Pickup Scheduled
              </p>
              <p className="font-semibold text-primary">{formatDate(order.pickup_scheduled_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Delivered Date</p>
              <p className="font-semibold">{formatDate(order.delivered_at)}</p>
            </div>
            <div>
              <Button
                variant="outline"
                className=""
                onClick={() => setShowPickupDialog(true)}
                disabled={!order?.pickup_location}
              >
                <p className="font-semibold">{order?.pickup_location || "N/A"}</p>
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <HugeiconsIcon icon={PackageIcon} className="h-5 w-5" />
                Package Details
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Weight</p>
              <p className="font-semibold">{order.weight ? `${order.weight} kg` : "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Length</p>
              <p className="font-semibold">{order.length ? `${order.length} cm` : "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Width</p>
              <p className="font-semibold">{order.width ? `${order.width} cm` : "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Height</p>
              <p className="font-semibold">{order.height ? `${order.height} cm` : "-"}</p>
            </div>
            {order.length && order.width && order.height && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Volumetric Weight</p>
                <p className="font-semibold">{((order.length * order.width * order.height) / 5000).toFixed(2)} kg</p>
              </div>
            )}
            {/* <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Base Shipping Charge</p>
              <p className="font-semibold">₹{order.base_shipping_charge || "-"}</p>
            </div> */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Final Charge</p>
              <p className="font-semibold">₹{order.shipping_charge || order.total_amount}</p>
            </div>
          </CardContent>
        </Card>

        {(order as any).products && (order as any).products.length > 0 && (
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HugeiconsIcon icon={PackageIcon} className="h-5 w-5" />
                  Product Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(order as any).products.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name || 'Product'}</span>
                    <span className="text-xs text-muted-foreground">Qty: {product.quantity || 1}</span>
                  </div>
                  <div className="font-semibold">₹{Number(product.price || 0) * Number(product.quantity || 1)}</div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <span className="font-semibold">Total Product Value</span>
                <span className="font-bold text-lg">₹{(order as any).productValue || 0}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {(order.label_url || order.track_url || liveStatus?.live_status) && (
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HugeiconsIcon icon={DeliveryTruck01Icon} className="h-5 w-5" />
                  Tracking & Live Status
                </CardTitle>
                {liveStatusLoading && <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {liveStatus?.live_status?.estimated_delivery && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <HugeiconsIcon icon={ClockIcon} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Estimated Delivery</p>
                    <p className="font-semibold text-blue-700 dark:text-blue-300">{formatDate(liveStatus.live_status.estimated_delivery)}</p>
                  </div>
                </div>
              )}

              {liveStatus?.history && liveStatus.history.length > 0 && (
                <ShipmentTimeline liveStatus={liveStatus} />
              )}

              <div className="flex flex-wrap gap-3">
                {/* {order.label_url && (
                  <a href={order.label_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <HugeiconsIcon icon={ExternalLinkIcon} className="h-4 w-4 mr-2" />
                      Print Label
                    </Button>
                  </a>
                )} */}
                {/* {order.track_url && (
                  <a href={order.track_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 mr-2" />
                      Track on Shiprocket
                    </Button>
                  </a>
                )} */}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Sender Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-bold">{order.order_pickup_address.name}</p>
                <p className="text-sm text-muted-foreground">{order.order_pickup_address.phone}</p>
                {order.order_pickup_address.email && <p className="text-sm text-muted-foreground">{order.order_pickup_address.email}</p>}
              </div>
              <Separator />
              <div className="text-sm">
                <p>{order.order_pickup_address.address}</p>
                <p>{order.order_pickup_address.city}, {order.order_pickup_address.state}</p>
                <p className="font-medium">{order.order_pickup_address.pincode}</p>
                <p className="text-muted-foreground">{order.order_pickup_address.country || "India"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Receiver Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-bold">{order.order_receiver_address.name}</p>
                <p className="text-sm text-muted-foreground">{order.order_receiver_address.phone}</p>
                {order.order_receiver_address.email && <p className="text-sm text-muted-foreground">{order.order_receiver_address.email}</p>}
              </div>
              <Separator />
              <div className="text-sm">
                <p>{order.order_receiver_address.address}</p>
                <p>{order.order_receiver_address.city}, {order.order_receiver_address.state}</p>
                <p className="font-medium">{order.order_receiver_address.pincode}</p>
                <p className="text-muted-foreground">{order.order_receiver_address.country || "India"}</p>
              </div>
            </CardContent>
          </Card>
        </div>


      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPickupDialog} onOpenChange={setShowPickupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Location01Icon} className="h-5 w-5 text-primary" />
              Pickup Location Details
            </DialogTitle>
            <DialogDescription>
              Complete address information for {order?.pickup_location}
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
                The pickup location &quot;{order?.pickup_location}&quot; was not found in your saved locations.
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

      <Dialog open={showSchedulePickupDialog} onOpenChange={setShowSchedulePickupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} className="h-5 w-5 text-primary" />
              Schedule Pickup
            </DialogTitle>
            <DialogDescription>
              Click “Schedule” to confirm a pickup for this order.
            </DialogDescription>
          </DialogHeader>

          { /* <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup Date</label>
              <DatePicker
                date={selectedPickupDate}
                onDateChange={setSelectedPickupDate}
                placeholder="Select pickup date"
                className="w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Leave empty to schedule pickup for today
            </p>
          </div>
         */ }

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowSchedulePickupDialog(false);
              setSelectedPickupDate(undefined);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSchedulePickup}
              disabled={schedulePickupMutation.isPending}
            >
              {schedulePickupMutation.isPending ? "Scheduling..." : "Schedule Pickup"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ShipmentHistory {
  id?: string;
  status_date: string;
  activity: string;
  location?: string;
  shipment_status: string;
}
const getStatusIconName = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return CheckmarkCircle01Icon;
    case "PENDING":
    case "OUT_FOR_PICKUP":
      return ArrowUpIcon;
    case "IN_TRANSIT":
    case "PICKED_UP":
      return TruckDeliveryIcon;
    default:
      return PackageIcon;
  }
};
const ShipmentTimeline = ({ liveStatus }: { liveStatus: any }) => {
  const now = new Date();

  const filteredHistory = (liveStatus?.history || [])
    .filter((item: ShipmentHistory, idx: number, arr: ShipmentHistory[]) => {
      const itemDate = new Date(item.status_date);

      if (itemDate > now) return false;

      const firstIndex = arr.findIndex(h =>
        h.status_date === item.status_date &&
        h.shipment_status === item.shipment_status
      );

      return firstIndex === idx;
    });

  return (
    <div className="relative pl-4  p-0 m-0 border-dotted border-muted-foreground/20 max-h-[500px] overflow-scroll">
      {filteredHistory.map((history: ShipmentHistory, index: number) => {
        const date = new Date(history.status_date);

        const day = date.getDate();

        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const month = monthNames[date.getMonth()];

        const time = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return (
          <div key={history.id || index} className="relative pb-9 pl-7 ml-4 border-l-2 p-0 m-0 border-dotted border-muted-foreground/20 last:pb-0">
            <div className={`absolute  -left-[22px] top-[10px] z-10 w-11 h-11  rounded-full border-4 border-background flex items-center justify-center ${index === 0 ? 'bg-primary' : 'bg-background'}`} >
              <HugeiconsIcon icon={getStatusIconName(history.shipment_status)} />
            </div>

            <div className="flex gap-4">
              <div className="text-center flex-1">
                <p className="text-xl font-medium">
                  {day} {month}
                </p>
                <p className="text-xs text-muted-foreground">{time}</p>
              </div>

              <div className="flex-3 flex justify-center flex-col">
                <p className="font-medium text-sm">{history.activity}</p>

                {history.location && (
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    {history.location}
                  </p>
                )}

                <ShipmentStatus status={history.shipment_status} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
