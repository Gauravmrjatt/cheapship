"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTrackOrder, TrackingResponse } from "@/lib/hooks/use-track";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SearchIcon,
  PackageIcon,
  TruckDeliveryIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckmarkCircle02Icon,
  UserIcon,
  MapsIcon,
} from "@hugeicons/core-free-icons";

const getStatusBadge = (status: string) => {
  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
    PENDING: "secondary",
    PICKED_UP: "default",
    IN_TRANSIT: "default",
    OUT_FOR_PICKUP: "default",
    DELIVERED: "success",
    RETURNED: "destructive",
    RTO: "destructive",
    CANCELLED: "destructive",
  };

  const variant = statusVariants[status] || "outline";

  return (
    <Badge variant={variant}>
      {status?.replace(/_/g, " ")}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusIconName = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return CheckmarkCircle02Icon;
    case "PENDING":
    case "OUT_FOR_PICKUP":
      return ArrowUpIcon;
    case "IN_TRANSIT":
    case "PICKED_UP":
      return TruckDeliveryIcon;
    default:
      return PackageIcon;
  }
};

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialAwb = searchParams.get("awb") || "";
  const [awb, setAwb] = useState(initialAwb);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, isError } = useTrackOrder(awb, !!initialAwb);

  useEffect(() => {
    if (initialAwb && initialAwb !== awb) {
      setAwb(initialAwb);
    }
  }, [initialAwb]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    inputRef.current?.blur();
    if (awb.trim()) {
      router.push(`/track?awb=${encodeURIComponent(awb.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
        {!data && !isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md text-center space-y-8">
              <div className="relative">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <HugeiconsIcon icon={TruckDeliveryIcon} className="w-16 h-16 text-primary" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <HugeiconsIcon icon={ArrowRightIcon} className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Track Your Shipment
                </h1>
                <p className="text-muted-foreground text-lg">
                  Enter your AWB number to get real-time updates on your delivery
                </p>
              </div>

              <Card className="mt-8">
                <CardContent className="pt-6">
                  <form onSubmit={handleSearch} className="flex gap-3">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Enter AWB Number (e.g., 7D122298844)"
                      value={awb}
                      onChange={(e) => setAwb(e.target.value)}
                      className="flex-1 h-12 text-lg font-mono"
                    />
                    <Button type="submit" size="lg" className="h-12 px-6" disabled={!awb.trim() || awb.length < 5}>
                      <HugeiconsIcon icon={SearchIcon} className="mr-2" />
                      Track
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center gap-8 pt-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <HugeiconsIcon icon={PackageIcon} className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Package</span>
                </div>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={ArrowRightIcon} className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <HugeiconsIcon icon={TruckDeliveryIcon} className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Transit</span>
                </div>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={ArrowRightIcon} className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <HugeiconsIcon icon={UserIcon} className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Delivered</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => {
                setAwb("");
                (document.activeElement as HTMLInputElement | null)?.blur();
                router.push("/track");
              }}
              className="mb-4"
            >
              <HugeiconsIcon icon={ArrowUpIcon} className="mr-2 rotate-90 w-4 h-4" />
              Track Another
            </Button>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
                </div>
                <p className="mt-6 text-muted-foreground animate-pulse">Searching for your shipment...</p>
              </div>
            )}

            {isError && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-12 pb-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                    <HugeiconsIcon icon={PackageIcon} className="w-10 h-10 text-destructive" />
                  </div>
                  <p className="text-destructive font-medium text-lg">
                    {error instanceof Error ? error.message : "Failed to track shipment"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Please check the AWB number and try again</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/track")}
                    className="mt-6"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {data && !isLoading && (
              <TrackingResult data={data} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TrackingResult({ data }: { data: TrackingResponse }) {
  const { order, live_status, history } = data;

  const allActivities = [
    ...(live_status?.activities || []),
    ...history
  ].sort((a, b) => new Date(b.status_date).getTime() - new Date(a.status_date).getTime());

  const uniqueActivities = allActivities.filter((activity, index, self) =>
    index === self.findIndex((a) => a.status === activity.status && a.status_date === activity.status_date)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader className="bg-primary text-primary-foreground pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Shipment Details</CardTitle>
              <p className="text-primary-foreground/70 text-sm mt-1">Order #{order.id}</p>
            </div>
            {getStatusBadge(order.shipment_status)}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <HugeiconsIcon icon={PackageIcon} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AWB Number</p>
                  <p className="font-mono font-semibold text-lg">{order.tracking_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <HugeiconsIcon icon={TruckDeliveryIcon} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Courier</p>
                  <p className="font-medium">{order.courier_name || "N/A"}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <HugeiconsIcon icon={ClockIcon} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shipment Created</p>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
              </div>
              {order.delivered_at && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered At</p>
                    <p className="font-medium text-green-600 dark:text-green-400">{formatDate(order.delivered_at)}</p>
                  </div>
                </div>
              )}
              {live_status?.estimated_delivery && !order.delivered_at && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <HugeiconsIcon icon={ClockIcon} className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Delivery</p>
                    <p className="font-medium text-blue-600">{formatDate(live_status.estimated_delivery)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {order.label_url && (
        <Card>
          <CardContent className="pt-4">
            <a
              href={order.label_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <HugeiconsIcon icon={PackageIcon} className="mr-2" />
              Download Label
            </a>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <HugeiconsIcon icon={TruckDeliveryIcon} className="mr-2" />
            Tracking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uniqueActivities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tracking history available</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-border"></div>
              <div className="space-y-1">
                {uniqueActivities.map((activity, index) => (
                  <div key={activity.id || index} className="relative flex items-start pl-4">
                    <div className={`relative z-10 w-11 h-11 rounded-full border-4 border-background flex items-center justify-center ${
                      index === 0 ? "bg-primary" : "bg-muted"
                    }`}>
                      <HugeiconsIcon 
                        icon={getStatusIconName(activity.status)} 
                        className={`w-5 h-5 ${
                          index === 0 ? "text-primary-foreground" : "text-muted-foreground"
                        }`} 
                      />
                    </div>
                    <div className="flex-1 ml-4 pb-6">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold ${
                          index === 0 ? "text-primary" : "text-foreground"
                        }`}>
                          {activity.activity || activity.status}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(activity.status_date)}</p>
                      </div>
                      {activity.location && (
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center">
                          <HugeiconsIcon icon={MapsIcon} className="mr-1 w-3.5 h-3.5" />
                          {activity.location}
                        </p>
                      )}
                      {index === 0 && (
                        <Badge variant="default" className="mt-2">Latest Status</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TrackContent />
    </Suspense>
  );
}
