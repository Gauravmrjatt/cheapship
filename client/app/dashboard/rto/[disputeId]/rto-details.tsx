"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useRTODisputeById, RTODispute } from "@/lib/hooks/use-dispute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DeliveryReturnIcon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";

export default function RTODisputeDetails({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = React.use(params);
  const router = useRouter();
  const { data: dispute, isLoading, isError } = useRTODisputeById(disputeId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <HugeiconsIcon icon={Clock01Icon} className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !dispute?.data) {
    return (
      <div className="p-5">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Card className="mt-4">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Failed to load RTO details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = dispute.data as RTODispute & {
    order?: {
      id: string;
      tracking_number: string;
      courier_name: string;
      shipment_status: string;
      rto_charges: number | null;
      created_at: string;
    };
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 mr-1" />
          Back
        </Button>
        {getStatusBadge(data.status)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={DeliveryReturnIcon} className="w-5 h-5" />
            RTO Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">RTO ID</p>
              <p className="font-semibold">#{data.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Order ID</p>
              <p className="font-semibold">#{data.order_id?.toString().slice(-8)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">AWB Number</p>
              <p className="font-mono text-sm">{data.order?.tracking_number || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Courier</p>
              <p className="font-semibold">{data.order?.courier_name || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Order Date</p>
              <p className="font-semibold">
                {data.order?.created_at ? format(new Date(data.order.created_at), "dd MMM yyyy") : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Shipment Status</p>
              <p className="font-semibold">{data.order?.shipment_status || "-"}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">Reason</p>
            <p className="font-semibold">{data.reason}</p>
          </div>

          {data.order?.rto_charges !== null && data.order?.rto_charges !== undefined && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">RTO Charges</p>
                <p className="text-xl font-bold text-destructive">₹{data.order.rto_charges}</p>
              </div>
            </>
          )}

          {data.action_reason && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {data.status === "ACCEPTED" ? "Approval" : "Rejection"} Reason
                </p>
                <p className="text-sm bg-muted p-3 rounded-lg">{data.action_reason}</p>
              </div>
            </>
          )}

          <Separator />
          <div className="flex justify-between text-xs text-muted-foreground">
            <p>Created: {format(new Date(data.created_at), "dd MMM yyyy, HH:mm")}</p>
            <p>Updated: {format(new Date(data.updated_at), "dd MMM yyyy, HH:mm")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
