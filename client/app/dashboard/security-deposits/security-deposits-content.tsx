"use client";

import * as React from "react";
import { useUserSecurityDeposits, SecurityDeposit } from "@/lib/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Wallet01Icon, 
  RefreshIcon,
  TimeIcon,
  CheckmarkCircle02Icon,
  ArrowRightIcon
} from "@hugeicons/core-free-icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function SecurityDepositsContent() {
  const { data, isLoading, refetch } = useUserSecurityDeposits();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partial Used</Badge>;
      case 'FULLY_USED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Fully Used</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Security Deposits</h1>
          <p className="text-muted-foreground">
            Track your security deposits and remaining amounts for each order
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <HugeiconsIcon icon={RefreshIcon} className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {data?.totals && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Security Deposited</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Number(data.totals.totalAmount).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-₹{Number(data.totals.totalUsed).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Remaining</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{Number(data.totals.totalRemaining).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Deposits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Wallet01Icon} />
            Security Deposit History
          </CardTitle>
          <CardDescription>
            List of all security deposits for your orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((deposit: SecurityDeposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-medium">
                      #{deposit.order_id.toString()}
                    </TableCell>
                    <TableCell>
                      {deposit.order?.shipment_status || '-'}
                    </TableCell>
                    <TableCell>₹{Number(deposit.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">
                      -₹{Number(deposit.used_amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      ₹{Number(deposit.remaining).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(deposit.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(deposit.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <HugeiconsIcon icon={Wallet01Icon} className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No security deposits found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your security deposits will appear here when you place orders
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}