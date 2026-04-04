


import { HugeiconsIcon } from "@hugeicons/react";
import {
    CopyIcon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  DeliveryTruck01Icon,
  DeliveryTruck02Icon,
  Cancel01Icon,
  PackageIcon,
  PackageSearchIcon,
  ShippingCenterIcon,
  ArrowLeft02Icon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
type Props = {
    status?: string;
};

export const statusConfig: Record<
    string,
    { label: string; icon: any; color: string }
> = {
    delivered: {
        label: "Delivered",
        icon: CheckmarkCircle01Icon,
        color: "text-green-600",
    },
    pending: {
        label: "Pending",
        icon: Loading03Icon,
        color: "text-yellow-500",
    },
    processing: {
        label: "Processing",
        icon: Loading03Icon,
        color: "text-blue-500",
    },
    manifested: {
        label: "Manifested",
        icon: PackageIcon,
        color: "text-orange-500",
    },
    out_for_pickup: {
        label: "Out for Pickup",
        icon: PackageSearchIcon,
        color: "text-purple-500",
    },
    picked_up: {
        label: "Picked Up",
        icon: PackageIcon,
        color: "text-purple-600",
    },
    in_transit: {
        label: "In Transit",
        icon: DeliveryTruck01Icon,
        color: "text-blue-600",
    },
    out_for_delivery: {
        label: "Out for Delivery",
        icon: DeliveryTruck02Icon,
        color: "text-indigo-600",
    },
    dispatched: {
        label: "Dispatched",
        icon: ShippingCenterIcon,
        color: "text-indigo-500",
    },
    cancelled: {
        label: "Cancelled",
        icon: Cancel01Icon,
        color: "text-red-500",
    },
    rto: {
        label: "Return to Origin",
        icon: ArrowLeft02Icon,
        color: "text-red-600",
    },
    not_picked: {
        label: "Not Picked",
        icon: AlertCircleIcon,
        color: "text-red-400",
    },
};

export function ShipmentStatus({ status }: Props) {
    const key = status?.toLowerCase() || "pending";

    const config =
        statusConfig[key] || {
            label: status,
            icon: AlertCircleIcon,
            color: "text-gray-500",
        };

    return (
        <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
            <HugeiconsIcon icon={config.icon} strokeWidth={2} className={`${config.color} size-3`} />
            {config.label}
        </Badge>
    );
}