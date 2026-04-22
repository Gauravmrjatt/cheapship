"use client";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL
import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  PackageSentIcon,
  DeliveryView01Icon,
  PackageOutOfStockIcon,
  Download02Icon,
  DashboardSquareAddIcon,
  PrinterIcon
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
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"
import { useGenerateManifest } from "@/lib/hooks/use-orders";

export const ActionsCell = ({
  row,
  handleCancelOrder
}: {
  row: any,
  handleCancelOrder: (id: string) => Promise<void>
}) => {
  const generateManifest = useGenerateManifest();
  const queryClient = useQueryClient();

  const handleGenerateManifest = async () => {
    try {
      await generateManifest(row.original.id);
      sileo.success({ title: "Manifest generated successfully" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate manifest";
      sileo.error({ title: message });
    }
  };

  return (
    <DropdownMenu>
      <ButtonGroup>
        {row.original.is_draft ? (
          <Button render={<Link href={`/dashboard/orders/new?id=${row.original.id}`} />} variant="secondary" className="font-bold text-primary"> <HugeiconsIcon className="bg-muted mr-1" icon={PackageSentIcon} strokeWidth={2} /> Ship Now</Button>
        ) : (<Button render={<Link href={`/dashboard/orders/${row.original.id}`} />} variant="secondary" className="font-bold text-primary"><HugeiconsIcon className="" icon={DeliveryView01Icon} strokeWidth={2} />{row.original.pickup_scheduled_date !== "" ? "View Now" : "Schedule Pickup"}</Button>
        )}
        <ButtonGroupSeparator />
        <DropdownMenuTrigger
          render={
            <Button
              variant="secondary"
            > <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
              <span className="sr-only">Open menu</span></Button>
          }
        >
        </DropdownMenuTrigger>
      </ButtonGroup>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem render={<Link href={`/dashboard/orders/${row.original.id}`} />}>
          <HugeiconsIcon className="" icon={DeliveryView01Icon} strokeWidth={2} />View Details
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
            <Link
              href={
                /^https?:\/\//i.test(row.original.label_url)
                  ? row.original.label_url
                  : `${BASE_URL}${row.original.label_url}`
              }
              download
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex gap-3 items-center"
            >
              <HugeiconsIcon icon={Download02Icon} strokeWidth={2} /> Download Label
            </Link>
          </DropdownMenuItem>
        )}
        {/* {row.original.is_draft && (
          <DropdownMenuItem render={<Link href={`/dashboard/orders/new?id=${row.original.id}`} />}>
            <span className="text-primary font-bold">Ship Now</span>
          </DropdownMenuItem>
        )} */}
        {row.original.shipment_status === "MANIFESTED" && !row.original.manifest_url && (
          <DropdownMenuItem onClick={handleGenerateManifest} disabled={generateManifest.isPending}>
            <HugeiconsIcon icon={DashboardSquareAddIcon} strokeWidth={2} />
            {generateManifest.isPending ? "Generating..." : "Generate Manifest"}
          </DropdownMenuItem>
        )}
        {row.original.manifest_url && (
          <DropdownMenuItem>
            <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} />
            <a href={row.original.manifest_url} target="_blank" rel="noopener noreferrer" className="w-full">
              Print Manifest
            </a>
          </DropdownMenuItem>
        )}
        {(row.original.shipment_status === "PENDING" || row.original.shipment_status === "DRAFT") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleCancelOrder(row.original.id)}
            >
              <HugeiconsIcon icon={PackageOutOfStockIcon} strokeWidth={2} /> Cancel Order
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
