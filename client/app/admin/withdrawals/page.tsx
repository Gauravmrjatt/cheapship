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
import { useAdminWithdrawals, useProcessWithdrawal } from "@/lib/hooks/use-admin";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Loading03Icon, 
  CheckmarkCircle01Icon, 
  Cancel01Icon,
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  FilterIcon,
  LeftToRightListBulletIcon,
  ArrowDown01Icon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export default function AdminWithdrawalsPage() {
  const [status, setStatus] = React.useState("ALL");
  const { data: withdrawals, isLoading } = useAdminWithdrawals(status);
  const processMutation = useProcessWithdrawal();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const handleProcess = (id: string, action: 'APPROVED' | 'REJECTED') => {
    if (confirm(`Are you sure you want to ${action.toLowerCase()} this withdrawal?`)) {
      processMutation.mutate({ id, status: action });
    }
  };

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
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
      accessorKey: "user.name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-xs text-foreground">{row.original.user.name}</span>
          <span className="text-[10px] text-muted-foreground">{row.original.user.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "user.wallet_balance",
      header: "Current Balance",
      cell: ({ row }) => (
        <span className="text-xs font-medium tabular-nums">₹{Number(row.original.user.wallet_balance).toLocaleString("en-IN")}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Requested Amount",
      cell: ({ row }) => (
        <span className="text-xs font-bold tabular-nums">₹{Number(row.original.amount).toLocaleString("en-IN")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn(
            "text-[9px] font-bold py-0 h-5 gap-1.5 capitalize",
            row.original.status === "APPROVED" && "text-green-600 border-green-200 bg-green-50",
            row.original.status === "REJECTED" && "text-red-600 border-red-200 bg-red-50",
            row.original.status === "PENDING" && "text-amber-600 border-amber-200 bg-amber-50"
          )}>
            {row.original.status === "PENDING" && <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} size={10} className="animate-spin" />}
            {row.original.status === "APPROVED" && <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} size={10} className="fill-green-500" />}
            {row.original.status === "REJECTED" && <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} size={10} />}
            {row.original.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-[10px] text-muted-foreground font-medium">
          {new Date(row.original.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-6">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right pr-6">
          {row.original.status === "PENDING" ? (
            <div className="flex justify-end gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-[10px] font-bold text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 rounded-lg px-3"
                onClick={() => handleProcess(row.original.id, 'APPROVED')}
                disabled={processMutation.isPending}
              >
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg px-3"
                onClick={() => handleProcess(row.original.id, 'REJECTED')}
                disabled={processMutation.isPending}
              >
                Reject
              </Button>
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground italic">Processed</div>
          )}
        </div>
      ),
    },
  ], [processMutation]);

  const table = useReactTable({
    data: withdrawals || [],
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
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 px-4 lg:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Finance & Withdrawals</h1>
        <p className="text-sm text-muted-foreground">Manage withdrawal requests and financial transactions</p>
      </div>

      <Tabs
        value={status}
        onValueChange={setStatus}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="flex w-fit lg:hidden" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All Requests</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <TabsList className="hidden lg:flex bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="ALL" className="rounded-lg">All Requests</TabsTrigger>
              <TabsTrigger value="PENDING" className="rounded-lg">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED" className="rounded-lg">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED" className="rounded-lg">Rejected</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <HugeiconsIcon icon={FilterIcon} strokeWidth={2} />
              <span className="hidden lg:inline">Filters</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} />
                <span className="hidden lg:inline">Columns</span>
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {table.getAllColumns().filter(c => c.getCanHide()).map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={v => column.toggleVisibility(!!v)}
                  >
                    {column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value={status} className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
          <div className="overflow-hidden border rounded-2xl bg-card/50">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-[10px] font-bold uppercase tracking-wider">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !withdrawals || withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No withdrawal requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/30 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-xs font-medium lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {withdrawals?.length || 0} requests selected.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Showing all requests
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button variant="outline" className="size-8" size="icon" disabled>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" disabled>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
