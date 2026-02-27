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
  useToggleUserStatus, 
  useRefundSecurityDeposit
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
import { AdminUser } from "@/lib/hooks/use-admin";
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
  UserBlock01Icon,
  LeftToRightListBulletIcon,
  PercentIcon,
  DeliveryTruck01Icon,
  Money03Icon,
  MoneyReceiveCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface UsersTableProps {
  data: AdminUser[];
  isLoading: boolean;
  pageSize: number;
  onOpenBoundsSheet: (userId: string, userName: string, currentMin?: number, currentMax?: number) => void;
  onOpenCustomRatesSheet: (userId: string, userName: string, currentRates?: any) => void;
}

export function UsersTable({
  data,
  isLoading,
  pageSize,
  onOpenBoundsSheet,
  onOpenCustomRatesSheet,
}: UsersTableProps) {
  const router = useRouter();
  const isMounted = React.useRef(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const toggleStatusMutation = useToggleUserStatus(isMounted);
  const refundDepositMutation = useRefundSecurityDeposit();

  const handleToggleStatus = (userId: string, currentStatus?: boolean) => {
    if (currentStatus === undefined || confirm(`Are you sure you want to ${currentStatus ? 'block' : 'unblock'} this user?`)) {
      toggleStatusMutation.mutate({ userId, is_active: !currentStatus });
    }
  };

  const handleRefundDeposit = (userId: string, userName: string, amount: number) => {
    if (confirm(`Are you sure you want to refund ₹${amount} security deposit to ${userName}'s wallet?`)) {
      refundDepositMutation.mutate(userId);
    }
  };

  const columns = React.useMemo<ColumnDef<AdminUser>[]>(() => [
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
      accessorKey: "wallet_balance",
      header: () => <div className="text-right">Balance</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums font-bold text-xs">
          ₹{Number(row.original.wallet_balance).toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      accessorKey: "security_deposit",
      header: () => <div className="text-right">Deposit</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums font-bold text-xs text-primary">
          ₹{Number(row.original.security_deposit || 0).toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      id: "orders",
      header: () => <div className="text-center">Orders</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="secondary" className="px-1.5 py-0 rounded-md text-[10px] font-bold">
            {row.original._count?.orders || 0}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
          {row.original.is_active ? (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="fill-green-500 dark:fill-green-400 size-3" />
          ) : (
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="text-red-500 size-3" />
          )}
          {row.original.is_active ? "Active" : "Blocked"}
        </Badge>
      ),
    },
    {
      id: "commission_bounds",
      header: "Commission Bounds",
      cell: ({ row }) => (
        <div className="text-xs">
          <Badge variant="secondary" className="text-[10px]">
            <HugeiconsIcon icon={PercentIcon} strokeWidth={2} className="size-3 mr-1" />
            {row.original.min_commission_rate !== null && row.original.min_commission_rate !== undefined
              ? `${row.original.min_commission_rate}% - ${row.original.max_commission_rate}%`
              : "0% - 100%"
            }
          </Badge>
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
              <DropdownMenuItem
                className={cn(row.original.is_active ? "text-destructive" : "text-primary", "font-medium")}
                onClick={() => handleToggleStatus(row.original.id, row.original.is_active)}
              >
                <HugeiconsIcon icon={row.original.is_active ? UserBlock01Icon : CheckmarkCircle01Icon} size={14} className="mr-2" />
                {row.original.is_active ? "Block User" : "Unblock User"}
              </DropdownMenuItem>

              {Number(row.original.security_deposit || 0) > 0 && (
                <DropdownMenuItem
                  className="text-primary font-medium"
                  onClick={() => handleRefundDeposit(row.original.id, row.original.name, Number(row.original.security_deposit))}
                >
                  <HugeiconsIcon icon={MoneyReceiveCircleIcon} size={14} className="mr-2" />
                  Refund Security Deposit
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => onOpenBoundsSheet(
                  row.original.id,
                  row.original.name,
                  row.original.min_commission_rate ? parseFloat(row.original.min_commission_rate as any) : undefined,
                  row.original.max_commission_rate ? parseFloat(row.original.max_commission_rate as any) : undefined
                )}
              >
                <HugeiconsIcon icon={PercentIcon} size={14} className="mr-2" />
                Set Commission Bounds
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOpenCustomRatesSheet(
                  row.original.id,
                  row.original.name,
                  row.original.assigned_rates
                )}
              >
                <HugeiconsIcon icon={DeliveryTruck01Icon} size={14} className="mr-2" />
                Set Service Overrides
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/transactions?userId=${row.original.id}`)}>
                <HugeiconsIcon icon={Money03Icon} size={14} className="mr-2" />
                View Transactions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/orders?userId=${row.original.id}`)}>
                <HugeiconsIcon icon={DeliveryTruck01Icon} size={14} className="mr-2" />
                View Orders
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [toggleStatusMutation, refundDepositMutation, onOpenBoundsSheet, onOpenCustomRatesSheet, router]);

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

  return (
    <div className="overflow-x-auto border rounded-2xl">
      <Table className="min-w-[640px]">
        <TableHeader className="bg-muted sticky top-0 z-10 rounded-2xl">
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
        <TableBody className="**:data-[slot=table-cell]:first:w-8 rounded-2xl">
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
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
