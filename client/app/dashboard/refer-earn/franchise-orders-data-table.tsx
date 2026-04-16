"use client";

import * as React from "react";
import { useState } from "react";
import {
  useFranchiseOrders,
  FranchiseOrder
} from "@/lib/hooks/use-franchise";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBasket01Icon,
  SearchIcon,
  Package01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FranchiseOrdersDataTableProps {
  franchiseId: string;
  franchiseName: string;
}

export function FranchiseOrdersDataTable({ franchiseId, franchiseName }: FranchiseOrdersDataTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useFranchiseOrders(franchiseId, page, pageSize, status);

  const filteredOrders = React.useMemo(() => {
    if (!data?.data) return [];
    if (!search) return data.data;
    return data.data.filter((order: FranchiseOrder) =>
      order.id.toString().toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex flex-col gap-4 p-6 border-b">
        <Tabs value={status} onValueChange={setStatus} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList className="w-fit">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
              <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-64">
              <HugeiconsIcon icon={SearchIcon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search order ID..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              {/* <TableHead className="text-right">Total Amount</TableHead> */}
              <TableHead className="text-right text-primary">Your Profit</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ["fos-1", "fos-2", "fos-3", "fos-4", "fos-5"].map((id) => (
                <TableRow key={id}>
                  <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                    <HugeiconsIcon icon={ShoppingBasket01Icon} size={48} className="text-muted-foreground" />
                    <p className="text-sm font-medium">No order activity found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: FranchiseOrder) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.id.toString().slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const s = order.shipment_status.toUpperCase();
                      return (
                        <Badge variant="secondary" className={cn(
                          "capitalize",
                          s === 'DELIVERED' && "text-green-600",
                          s === 'PENDING' && "text-yellow-600",
                          s === 'CANCELLED' && "text-red-600",
                          s === 'IN_TRANSIT' && "text-blue-600"
                        )}>
                          {s.toLowerCase().replace(/_/g, " ")}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  {/* <TableCell className="text-right font-medium">
                    {formatCurrency(Number(order.shipping_charge || order.total_amount))}
                  </TableCell> */}
                  <TableCell className="text-right font-semibold text-green-600">
                    {(() => {
                      const s = order.shipment_status.toUpperCase();
                      return s === 'DRAFT'
                        ? 0
                        : formatCurrency(Number(order.franchise_commission_amount || 0));
                    })()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Showing {filteredOrders.length} of {data.pagination.total} records
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(1)} disabled={page === 1}>
              <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={14} />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            </Button>
            <span className="text-xs font-medium px-2">Page {page} of {data.pagination.totalPages}</span>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages}>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(data.pagination.totalPages)} disabled={page === data.pagination.totalPages}>
              <HugeiconsIcon icon={ArrowRightDoubleIcon} size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
