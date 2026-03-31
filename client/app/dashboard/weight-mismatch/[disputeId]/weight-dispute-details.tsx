"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useWeightDisputeById, WeightDispute } from "@/lib/hooks/use-dispute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  WeightScale01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon,
  ImageAdd01Icon,
  PackageIcon
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";

const calculateVolumetricWeight = (length: number | null, width: number | null, height: number | null) => {
  if (!length || !width || !height) return null;
  return (Number(length) * Number(width) * Number(height)) / 5000;
};

const formatAmount = (amount: number) => {
  const sign = amount > 0 ? "+" : "";
  return sign + new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function WeightDisputeDetails({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = React.use(params);
  const router = useRouter();
  const { data: dispute, isLoading, isError } = useWeightDisputeById(disputeId);

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
            <p className="text-muted-foreground">Failed to load dispute details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = dispute.data as WeightDispute & {
    order?: {
      id: string;
      tracking_number: string;
      courier_name: string;
      length: number | null;
      width: number | null;
      height: number | null;
      weight: number | null;
      shipping_charge: number | null;
      shipment_status: string;
      created_at: string;
    };
  };

  const volumetricWeight = calculateVolumetricWeight(
    data.order?.length ?? null,
    data.order?.width ?? null,
    data.order?.height ?? null
  );

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
            <HugeiconsIcon icon={WeightScale01Icon} className="w-5 h-5" />
            Weight Dispute Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Dispute ID</p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Declared Weight</p>
              <p className="text-xl font-bold">{data.applied_weight} kg</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Charged Weight</p>
              <p className="text-xl font-bold text-destructive">{data.charged_weight} kg</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Difference</p>
              <p className="text-xl font-bold">
                {(data.charged_weight - data.applied_weight).toFixed(2)} kg
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Applied Amount</p>
              <p className="text-xl font-semibold">₹{data.applied_amount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Charged Amount</p>
              <p className="text-xl font-semibold text-destructive">₹{data.charged_amount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Difference Amount</p>
              <p className={`text-xl font-bold ${data.difference_amount > 0 ? "text-green-600" : "text-red-600"}`}>
                {formatAmount(data.difference_amount)}
              </p>
            </div>
          </div>

          {data.order && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Length</p>
                  <p className="font-semibold">{data.order.length ? `${data.order.length} cm` : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Width</p>
                  <p className="font-semibold">{data.order.width ? `${data.order.width} cm` : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Height</p>
                  <p className="font-semibold">{data.order.height ? `${data.order.height} cm` : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Volumetric Weight</p>
                  <p className="font-semibold">
                    {volumetricWeight ? `${volumetricWeight.toFixed(2)} kg` : "-"}
                  </p>
                </div>
              </div>
            </>
          )}

          {data.product_category && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Product Category</p>
                <p className="font-semibold">{data.product_category}</p>
              </div>
            </>
          )}

          {data.discrepancy_description && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Description</p>
              <p className="text-sm">{data.discrepancy_description}</p>
            </div>
          )}

          {(data.weight_scale_image || data.packed_box_image) && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Images</p>
                <div className="flex gap-4">
                  {data.weight_scale_image && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <HugeiconsIcon icon={WeightScale01Icon} className="w-5 h-5" />
                      <span className="text-sm">Weight Scale Image</span>
                    </div>
                  )}
                  {data.packed_box_image && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <HugeiconsIcon icon={PackageIcon} className="w-5 h-5" />
                      <span className="text-sm">Packed Box Image</span>
                    </div>
                  )}
                </div>
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
