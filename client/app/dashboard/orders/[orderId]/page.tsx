"use client";

import { useOrder } from "@/lib/hooks/use-order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderDetailsPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { data: order, isLoading, isError } = useOrder(params.orderId);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching order details</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Order Details</h1>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Order ID:</strong> {order.id}</p>
            <p><strong>Order Type:</strong> {order.order_type}</p>
            <p><strong>Shipment Type:</strong> {order.shipment_type}</p>
            <p><strong>Payment Mode:</strong> {order.payment_mode}</p>
            <p><strong>Total Amount:</strong> {order.total_amount}</p>
            <p><strong>Shipment Status:</strong> {order.shipment_status}</p>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Pickup Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Name:</strong> {order.order_pickup_address.name}</p>
              <p><strong>Phone:</strong> {order.order_pickup_address.phone}</p>
              <p><strong>Email:</strong> {order.order_pickup_address.email}</p>
              <p><strong>Address:</strong> {order.order_pickup_address.address}</p>
              <p><strong>City:</strong> {order.order_pickup_address.city}</p>
              <p><strong>State:</strong> {order.order_pickup_address.state}</p>
              <p><strong>Pincode:</strong> {order.order_pickup_address.pincode}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Receiver Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Name:</strong> {order.order_receiver_address.name}</p>
              <p><strong>Phone:</strong> {order.order_receiver_address.phone}</p>
              <p><strong>Email:</strong> {order.order_receiver_address.email}</p>
              <p><strong>Address:</strong> {order.order_receiver_address.address}</p>
              <p><strong>City:</strong> {order.order_receiver_address.city}</p>
              <p><strong>State:</strong> {order.order_receiver_address.state}</p>
              <p><strong>Pincode:</strong> {order.order_receiver_address.pincode}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}