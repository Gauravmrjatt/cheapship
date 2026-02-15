"use client";

import * as React from "react";
import { useOrder } from "@/lib/hooks/use-order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = React.use(params);
  const { data: order, isLoading, isError } = useOrder(orderId);

  if (isLoading) return <div className="max-w-7xl mx-auto py-10 px-4">Loading...</div>;
  if (isError) return <div className="max-w-7xl mx-auto py-10 px-4">Error fetching order details</div>;
  if (!order) return <div className="max-w-7xl mx-auto py-10 px-4">Order not found</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-700">
      <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
      <div className="space-y-8">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Order ID</p>
              <p className="font-semibold">#{order.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
              <p className="font-semibold">{order.shipment_status}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Amount</p>
              <p className="font-semibold">₹{order.total_amount}</p>
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
          </CardContent>
        </Card>

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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
