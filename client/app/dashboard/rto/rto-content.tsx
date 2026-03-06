"use client";

import * as React from "react";
import { useState } from "react";
import { useRTODisputes, RTODispute } from "@/lib/hooks/use-dispute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DeliveryReturnIcon,
  SearchIcon,
  Loading03Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon
} from "@hugeicons/core-free-icons";

function Rtocontent() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: rtoData, isLoading } = useRTODisputes(page, pageSize, statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><HugeiconsIcon icon={Clock01Icon} className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RTO History</h1>
          <p className="text-muted-foreground">View your Return to Origin (RTO) records</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={DeliveryReturnIcon} className="w-5 h-5" />
            RTO Records
          </CardTitle>
          <CardDescription>
            A list of all RTO (Return to Origin) charges applied to your orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>AWB Number</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <HugeiconsIcon icon={Loading03Icon} className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : rtoData?.data && rtoData.data.length > 0 ? (
                  rtoData.data.map((rto: RTODispute) => (
                    <TableRow key={rto.id}>
                      <TableCell className="font-medium">{rto.order_id}</TableCell>
                      <TableCell className="text-sm">{rto.order?.tracking_number || "N/A"}</TableCell>
                      <TableCell className="text-sm">{rto.order?.courier_name || "N/A"}</TableCell>
                      <TableCell className="text-sm">{rto.reason}</TableCell>
                      <TableCell>{getStatusBadge(rto.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(rto.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No RTO records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {rtoData?.pagination && rtoData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {rtoData.pagination.totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= rtoData.pagination.totalPages}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Rtocontent;
