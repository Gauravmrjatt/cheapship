"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useAdminSecurityDeposits, AdminSecurityDeposit } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Wallet01Icon, 
  RefreshIcon,
  SearchIcon,
  UserIcon,
  MailIcon
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function SecurityDepositsAdminContent() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  
  const { data, isLoading, refetch } = useAdminSecurityDeposits(page, 20, statusFilter);

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value || "");
  };

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
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partial</Badge>;
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
          <h1 className="text-2xl font-bold tracking-tight">Security Deposits</h1>
          <p className="text-muted-foreground">
            View all user security deposits and their status
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <HugeiconsIcon icon={RefreshIcon} className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="FULLY_USED">Fully Used</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security Deposits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Wallet01Icon} />
            All Security Deposits
          </CardTitle>
          <CardDescription>
            Complete list of security deposits with usage tracking
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
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((deposit: AdminSecurityDeposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell className="font-medium">
                        #{deposit.order_id.toString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{deposit.user?.name || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">{deposit.user?.mobile || ''}</span>
                        </div>
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

              {/* Pagination */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((data.pagination.currentPage - 1) * data.pagination.pageSize) + 1} to{' '}
                    {Math.min(data.pagination.currentPage * data.pagination.pageSize, data.pagination.total)} of{' '}
                    {data.pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <HugeiconsIcon icon={Wallet01Icon} className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No security deposits found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}