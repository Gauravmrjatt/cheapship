"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  AdminKycUser
} from "@/lib/hooks/use-admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  LeftToRightListBulletIcon,
  ViewIcon,
  Loading03Icon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface KycTableProps {
  data: AdminKycUser[];
  isLoading: boolean;
  pageSize: number;
  onViewDetails: (user: AdminKycUser) => void;
}

export function KycTable({
  data,
  isLoading,
  pageSize,
  onViewDetails,
}: KycTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo<ColumnDef<AdminKycUser>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "User Details",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono uppercase">#{row.original.id.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium">{row.original.email}</span>
          <span className="text-muted-foreground">{row.original.mobile}</span>
        </div>
      ),
    },
    {
      accessorKey: "kyc_status",
      header: "KYC Status",
      cell: ({ row }) => {
        const baseStatus = row.original.kyc_status;

        let displayStatus = baseStatus.toLowerCase();
        let icon = null;
        let iconClass = "";

        if (baseStatus === "VERIFIED") {
          icon = CheckmarkCircle01Icon;
          displayStatus = "verified";
          iconClass = "text-green-600 dark:text-green-400";
        }

        else if (baseStatus === "SUBMITTED") {
          icon = Loading03Icon;
          displayStatus = "submitted";
          iconClass = "text-blue-600 dark:text-blue-400 animate-spin";
        }

        else if (baseStatus === "PENDING") {
          icon = Loading03Icon;
          displayStatus = "pending";
          iconClass = "text-muted-foreground animate-spin";
        }

        else if (baseStatus === "REJECTED") {
          icon = Cancel01Icon;
          displayStatus = "rejected";
          iconClass = "text-red-600 dark:text-red-400";
        }

        return (
          <Badge
            variant="outline"
            className="px-1.5 capitalize gap-1.5 text-muted-foreground"
          >
            {icon && (
              <HugeiconsIcon
                icon={icon}
                strokeWidth={2}
                className={cn("size-3", iconClass)}
              />
            )}
            {displayStatus}
          </Badge>
        );
      },
    },
    {
      id: "documents",
      header: "Documents",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">PAN:</span>
            <span className={cn(row.original.pan_verified ? "text-green-600 font-bold" : "text-muted-foreground")}>
              {row.original.pan_number || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">AAD:</span>
            <span className={cn(row.original.aadhaar_verified ? "text-green-600 font-bold" : "text-muted-foreground")}>
              {row.original.aadhaar_number || "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Last Updated",
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {format(new Date(row.original.updated_at), "MMM d, yyyy HH:mm")}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-6">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right pr-6">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="size-8"
                  size="icon"
                />
              }
            >
              <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
                <HugeiconsIcon icon={ViewIcon} size={14} className="mr-2" />
                View & Verify
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [onViewDetails]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  return (
    <div className="overflow-x-auto border rounded-2xl">
      <Table className="min-w-[640px] rounded-2xl">
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {isLoading ? (
            Array.from({ length: pageSize }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No KYC requests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
