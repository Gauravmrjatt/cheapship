"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Wallet01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  Package01Icon,
  Location01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { useHttp } from "@/lib/hooks/use-http";

interface PendingOrder {
  id: string;
  order_type: string;
  shipment_status: string;
  cod_amount: number;
  created_at: string;
  order_receiver_address?: {
    name: string;
    city: string;
    state: string;
  };
}

interface RemittedOrder {
  id: string;
  order_type: string;
  shipment_status: string;
  cod_amount: number;
  remitted_amount: number;
  remitted_at: string;
  remittance_ref_id: string;
  order_receiver_address?: {
    name: string;
    city: string;
    state: string;
  };
}

export default function RemittancesPage() {
  const http = useHttp();

  const { data: pendingData, isLoading: isLoadingPending } = useQuery<{
    orders: PendingOrder[];
    totalPending: number;
  }>(
    http.get(
      ["remittances", "pending"],
      "/orders/remittances/pending",
      true
    )
  );

  const { data: historyData, isLoading: isLoadingHistory } = useQuery<RemittedOrder[]>(
    http.get(
      ["remittances", "history"],
      "/orders/remittances/history",
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "outline"; color: string }> = {
      PENDING: { variant: "secondary", color: "text-yellow-600" },
      PROCESSING: { variant: "secondary", color: "text-blue-600" },
      REMITTED: { variant: "secondary", color: "text-green-600" },
      FAILED: { variant: "secondary", color: "text-red-600" },
    };
    const config = statusConfig[status] || { variant: "outline", color: "" };
    return (
      <Badge variant={config.variant} className={`${config.color} capitalize`}>
        {status.toLowerCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HugeiconsIcon icon={Wallet01Icon} size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">COD & Remittances</h1>
          <p className="text-sm text-muted-foreground">
            Track your Cash on Delivery remittances
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Remittance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPending ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(pendingData?.totalPending || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {pendingData?.orders?.length || 0} orders awaiting remittance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Remitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  historyData?.reduce((sum, o) => sum + (o.remitted_amount || 0), 0) || 0
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {historyData?.length || 0} orders remitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total COD Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPending && isLoadingHistory ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {(pendingData?.orders?.length || 0) + (historyData?.length || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              All COD orders combined
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="pending" className="gap-2">
            <HugeiconsIcon icon={Loading03Icon} size={16} />
            Pending ({pendingData?.orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoadingPending ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : pendingData?.orders?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-3 bg-muted rounded-full mb-4">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">No Pending Remittances</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All your COD amounts have been remitted
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Receiver</TableHead>
                        <TableHead>COD Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingData?.orders?.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.id.toString().slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
                              <div>
                                <p className="text-sm">{order.order_receiver_address?.name || "-"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.order_receiver_address?.city}, {order.order_receiver_address?.state}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(order.cod_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {order.shipment_status?.toLowerCase().replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <HugeiconsIcon icon={Calendar01Icon} size={14} />
                              {formatDate(order.created_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoadingHistory ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : historyData?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-3 bg-muted rounded-full mb-4">
                    <HugeiconsIcon icon={Wallet01Icon} size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">No Remittance History</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your remitted orders will appear here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Receiver</TableHead>
                        <TableHead>COD Amount</TableHead>
                        <TableHead>Remitted Amount</TableHead>
                        <TableHead>Reference ID</TableHead>
                        <TableHead>Remitted On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData?.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.id.toString().slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
                              <div>
                                <p className="text-sm">{order.order_receiver_address?.name || "-"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.order_receiver_address?.city}, {order.order_receiver_address?.state}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(order.cod_amount)}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(order.remitted_amount)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {order.remittance_ref_id || "-"}
                            </code>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <HugeiconsIcon icon={Calendar01Icon} size={14} />
                              {formatDate(order.remitted_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
