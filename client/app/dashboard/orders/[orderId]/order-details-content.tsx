"use client";

import * as React from "react";
import { useOrder, useLiveOrderStatus, useAssignAWB, useSchedulePickup, useGenerateLabel } from "@/lib/hooks/use-order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderDetailSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  RefreshIcon, 
  PackageIcon, 
  DeliveryTruck01Icon, 
  Location01Icon, 
  LinkCircle02Icon as ExternalLinkIcon, 
  Timer01Icon, 
  CheckmarkCircle01Icon, 
  CircleDot,
  Clock01Icon as ClockIcon,
  Add01Icon,
  ShippingTruck01Icon,
  Calendar01Icon
} from "@hugeicons/core-free-icons";

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

const formatDate = (date: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());

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
  
    const handleSchedulePickup = () => {
      schedulePickupMutation.mutate({ orderId });
    };
  
    const handleGenerateLabel = () => {
      generateLabelMutation.mutate({ orderId });
    };

  if (isLoading) return <OrderDetailSkeleton />;
  if (isError) return <div className="max-w-7xl mx-auto py-10 px-4">Error fetching order details</div>;
  if (!order) return <div className="max-w-7xl mx-auto py-10 px-4">Order not found</div>;

  const isDelivered = order.shipment_status === "DELIVERED";
  const isCancelled = order.shipment_status === "CANCELLED";
  const hasAWB = !!order.tracking_number;
  const isPending = order.shipment_status === "PENDING";

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground">Order ID: #{orderId}</p>
        </div>
        <div className="flex gap-2">
          {isPending && !hasAWB && (
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
              onClick={handleSchedulePickup} 
              disabled={schedulePickupMutation.isPending}
              variant="secondary"
              className="rounded-xl font-bold gap-2"
            >
              {schedulePickupMutation.isPending ? <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin" /> : <HugeiconsIcon icon={ShippingTruck01Icon} className="h-4 w-4" />}
              Schedule Pickup
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={liveStatusLoading} className="rounded-xl">
            <HugeiconsIcon icon={RefreshIcon} className={`h-4 w-4 mr-2 ${liveStatusLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order Information</CardTitle>
              <Badge className={`${statusColors[order.shipment_status] || "bg-gray-500"} text-white`}>
                {order.shipment_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Order ID</p>
              <p className="font-semibold">#{order.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Order ID</p>
              <p className="font-mono text-sm">{order.shiprocket_order_id || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Shipment ID</p>
              <p className="font-mono text-sm">{order.shiprocket_shipment_id || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Tracking Number</p>
              <p className="font-mono text-sm">{order.tracking_number || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Shipping Amount</p>
              <p className="font-semibold">₹{order.total_amount}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Product Value</p>
              <p className="font-semibold">₹{order.product_amount || order.total_amount}</p>
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
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Base Shipping Charge</p>
              <p className="font-semibold">₹{order.base_shipping_charge || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Final Charge</p>
              <p className="font-semibold">₹{order.shipping_charge || order.total_amount}</p>
            </div>
          </CardContent>
        </Card>

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
              {liveStatus?.live_status && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[liveStatus.live_status.current_status] || "bg-gray-500"} text-white`}>
                        {liveStatus.live_status.status}
                      </Badge>
                      {liveStatus.live_status.estimated_delivery && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
                          ETA: {new Date(liveStatus.live_status.estimated_delivery).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Last updated: {formatDate(lastUpdated.toISOString())}
                    </span>
                  </div>
                  {liveStatus.live_status.courier && (
                    <p className="text-sm">
                      <span className="font-medium">Courier:</span> {liveStatus.live_status.courier}
                    </p>
                  )}
                  {liveStatus.live_status.tracking_number && (
                    <p className="text-sm">
                      <span className="font-medium">Tracking:</span> {liveStatus.live_status.tracking_number}
                    </p>
                  )}
                  {liveStatus.live_status.activities && liveStatus.live_status.activities.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Tracking Timeline</p>
                      {liveStatus.live_status.activities.map((activity: any, index: number) => (
                        <div key={index} className="flex gap-3 text-sm">
                          <div className="flex flex-col items-center">
                            {index === 0 ? (
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-green-500" />
                            ) : (
                              <HugeiconsIcon icon={CircleDot} className="h-4 w-4 text-muted-foreground" />
                            )}
                            {index < liveStatus.live_status.activities.length - 1 && (
                              <div className="w-0.5 h-full bg-muted-foreground/30 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <p className="font-medium">{activity.status}</p>
                            {activity.location && <p className="text-muted-foreground text-xs">{activity.location}</p>}
                            {activity.date && (
                              <p className="text-muted-foreground text-xs">{formatDate(activity.date)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {order.label_url && (
                  <a href={order.label_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <HugeiconsIcon icon={ExternalLinkIcon} className="h-4 w-4 mr-2" />
                      Print Label
                    </Button>
                  </a>
                )}
                {order.track_url && (
                  <a href={order.track_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 mr-2" />
                      Track on Shiprocket
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Pickup Address</CardTitle>
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

        {liveStatus?.history && liveStatus.history.length > 0 && (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Shipment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveStatus.history.map((history: any) => (
                  <div key={history.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="flex flex-col items-center">
                      <HugeiconsIcon icon={CircleDot} className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{history.status}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(history.status_date)}</p>
                      </div>
                      {history.location && <p className="text-sm text-muted-foreground">{history.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
