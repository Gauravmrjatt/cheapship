"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalCircle01Icon,
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";

const generateManifest = async (orderId: string) => {
  const res = await fetch(`/api/v1/orders/${orderId}/manifest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!res.ok) throw new Error('Failed to generate manifest');
  return res.json();
};

export const ActionsCell = ({
  row,
  handleCancelOrder
}: {
  row: any,
  handleCancelOrder: (id: string) => Promise<void>
}) => {
  const [isGeneratingManifest, setIsGeneratingManifest] = React.useState(false);
  const queryClient = useQueryClient();

  const handleGenerateManifest = async () => {
    setIsGeneratingManifest(true);
    try {
      await generateManifest(row.original.id);
      sileo.success({ title: "Manifest generated successfully" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate manifest";
      sileo.error({ title: message });
    } finally {
      setIsGeneratingManifest(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="data-open:bg-muted text-muted-foreground flex size-8"
            size="icon"
          > <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
            <span className="sr-only">Open menu</span></Button>
        }
      >

      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem render={<Link href={`/dashboard/orders/${row.original.id}`} />}>
          View Details
        </DropdownMenuItem>
        {row.original.tracking_number && row.original.track_url && (
          <DropdownMenuItem>
            <a href={row.original.track_url} target="_blank" rel="noopener noreferrer" className="w-full">
              Track Shipment
            </a>
          </DropdownMenuItem>
        )}
        {row.original.label_url && (
          <DropdownMenuItem>
            <a href={row.original.label_url} target="_blank" rel="noopener noreferrer" className="w-full">
              Download Label
            </a>
          </DropdownMenuItem>
        )}
        {row.original.is_draft && (
          <DropdownMenuItem render={<Link href={`/dashboard/orders/new?id=${row.original.id}`} />}>
            <span className="text-primary font-bold">Ship Now</span>
          </DropdownMenuItem>
        )}
        {row.original.shipment_status === "MANIFESTED" && !row.original.manifest_url && (
          <DropdownMenuItem onClick={handleGenerateManifest} disabled={isGeneratingManifest}>
            {isGeneratingManifest ? "Generating..." : "Generate Manifest"}
          </DropdownMenuItem>
        )}
        {row.original.manifest_url && (
          <DropdownMenuItem>
            <a href={row.original.manifest_url} target="_blank" rel="noopener noreferrer" className="w-full">
              Print Manifest
            </a>
          </DropdownMenuItem>
        )}
        {row.original.shipment_status === "PENDING" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleCancelOrder(row.original.id)}
            >
              Cancel Order
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function DataTablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  filteredCount
}: {
  pagination?: {
    currentPage: number
    pageSize: number
    totalPages: number
    total: number
  },
  onPageChange?: (page: number) => void,
  onPageSizeChange?: (pageSize: number) => void,
  filteredCount: number
}) {
  if (!pagination) return null;

  return (
    <div className="flex items-center justify-between px-4 mt-4">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex tabular-nums">
        Showing {filteredCount} of {pagination.total} records
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-xs font-bold uppercase text-muted-foreground">
            Rows per page
          </Label>
          <Select
            value={`${pagination.pageSize}`}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger size="sm" className="w-20 h-8" id="rows-per-page">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-xs font-bold uppercase text-muted-foreground">
          Page {pagination.currentPage} of {pagination.totalPages}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange?.(1)}
            disabled={pagination.currentPage === 1}
          >
            <span className="sr-only">Go to first page</span>
            <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => onPageChange?.(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            <span className="sr-only">Go to previous page</span>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => onPageChange?.(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            <span className="sr-only">Go to next page</span>
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => onPageChange?.(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            <span className="sr-only">Go to last page</span>
            <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
