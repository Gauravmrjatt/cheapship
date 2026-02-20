"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Invoice01Icon,
  Download02Icon,
  Calendar01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { useHttp } from "@/lib/hooks/use-http";

interface InvoiceOrder {
  id: string;
  order_type: string;
  shipment_status: string;
  payment_mode: string;
  total_amount: number;
  shipping_charge: number;
  created_at: string;
  delivered_at: string | null;
  courier_name: string;
  order_receiver_address?: {
    name: string;
    city: string;
    state: string;
  };
}

interface InvoicesResponse {
  data: InvoiceOrder[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export default function InvoicesPage() {
  const http = useHttp();

  const { data, isLoading } = useQuery<InvoicesResponse>(
    http.get(
      ["invoices"],
      "/orders?shipment_status=DELIVERED&pageSize=50",
      true
    )
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPaymentStatusBadge = (paymentMode: string) => {
    if (paymentMode === "COD") {
      return <Badge variant="secondary">COD</Badge>;
    }
    return <Badge variant="default">Prepaid</Badge>;
  };

  const downloadInvoice = (orderId: string) => {
    window.open(`/api/v1/orders/${orderId}/invoice`, "_blank");
  };

  const invoices = data?.data || [];

  return (
    <div className="space-y-8 p-5 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-2xl font-bold">{invoices.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Delivered orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  invoices.reduce((sum, o) => sum + (o.total_amount || 0), 0)
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Shipping charges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : invoices.length > 0 ? (
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {formatDate(invoices[0].delivered_at || invoices[0].created_at)}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">No invoices yet</span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-3 bg-muted rounded-full mb-4">
                <HugeiconsIcon icon={Invoice01Icon} size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No Invoices Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Invoices will appear here once your orders are delivered
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        INV-{order.id.toString().slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">#{order.id.toString().slice(0, 8)}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={Calendar01Icon} size={14} />
                          {formatDate(order.delivered_at || order.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{order.order_receiver_address?.name || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.order_receiver_address?.city}, {order.order_receiver_address?.state}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{order.courier_name || "N/A"}</span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(order.payment_mode)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadInvoice(order.id)}
                        >
                          <HugeiconsIcon icon={Download02Icon} size={16} />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
