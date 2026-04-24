"use client";

import * as React from "react";
import Image from "next/image";
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
import { useAdminWithdrawalUserGroups, useProcessUserWithdrawals, WithdrawalUserGroup } from "@/lib/hooks/use-admin";
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
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  ArrowDown01Icon,
  MoneySend01Icon,
  Search01Icon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { sileo } from "sileo";

export default function AdminWithdrawalsPage() {
  const [status, setStatus] = React.useState("ALL");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const { data, isLoading } = useAdminWithdrawalUserGroups(page, pageSize, status, search);
  const processMutation = useProcessUserWithdrawals();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [selectedUserGroup, setSelectedUserGroup] = React.useState<WithdrawalUserGroup | null>(null);
  const [showDialog, setShowDialog] = React.useState(false);
  const [withdrawalForm, setWithdrawalForm] = React.useState({
    status: "APPROVED",
    reference_id: "",
    payment_method: "UPI" as "UPI" | "BANK"
  });

  const tableData = React.useMemo(() => data?.data || [], [data?.data]);

  const openDialog = (userGroup: WithdrawalUserGroup) => {
    setSelectedUserGroup(userGroup);
    setWithdrawalForm({
      status: "APPROVED",
      reference_id: "",
      payment_method: userGroup.user.upi_id ? "UPI" : "BANK"
    });
    setShowDialog(true);
  };

  const handleUpdate = () => {
    if (!selectedUserGroup) return;
    processMutation.mutate(
      { 
        userId: selectedUserGroup.user.id, 
        status: withdrawalForm.status as 'APPROVED' | 'REJECTED',
        reference_id: withdrawalForm.reference_id || undefined,
        payment_method: withdrawalForm.payment_method
      },
      {
        onSuccess: () => {
          setShowDialog(false);
          setSelectedUserGroup(null);
        },
        onError: (error: Error) => {
          sileo.error({ title: "Error", description: error.message || "Failed to process withdrawals" });
        }
      }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const qrUrl = selectedUserGroup?.user?.upi_id 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${selectedUserGroup.user.upi_id}&am=${selectedUserGroup.pending_amount}`)}`
    : null;

  const columns = React.useMemo<ColumnDef<WithdrawalUserGroup>[]>(() => [
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
      id: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-xs text-foreground">{row.original.user?.name}</span>
          <span className="text-[10px] text-muted-foreground">{row.original.user?.email}</span>
          {row.original.user?.mobile && (
            <span className="text-[10px] text-blue-600 font-medium">{row.original.user.mobile}</span>
          )}
          {row.original.user?.upi_id && (
            <span className="text-[10px] text-green-600">{row.original.user.upi_id}</span>
          )}
          {row.original.user?.bank_name && (
            <span className="text-[10px] text-green-600">{row.original.user.bank_name} - A/C: XXXX{row.original.user.account_number?.slice(-4)}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "user.wallet_balance",
      header: "Current Balance",
      cell: ({ row }) => (
        <span className="text-xs font-medium tabular-nums">₹{Number(row.original.user?.wallet_balance || 0).toLocaleString("en-IN")}</span>
      ),
    },
    {
      accessorKey: "request_count",
      header: "Requests",
      cell: ({ row }) => (
        <span className="text-xs font-bold">{row.original.request_count} request{row.original.request_count !== 1 ? 's' : ''}</span>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => (
        <span className="text-xs font-bold tabular-nums">₹{Number(row.original.total_amount).toLocaleString("en-IN")}</span>
      ),
    },
    {
      accessorKey: "pending_amount",
      header: "Pending",
      cell: ({ row }) => (
        <span className="text-xs font-medium tabular-nums text-yellow-600">₹{Number(row.original.pending_amount || 0).toLocaleString("en-IN")}</span>
      ),
    },
    {
      accessorKey: "approved_amount",
      header: "Approved",
      cell: ({ row }) => (
        <span className="text-xs font-medium tabular-nums text-green-600">₹{Number(row.original.approved_amount || 0).toLocaleString("en-IN")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status.toLowerCase();
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
            {status === "approved" ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="fill-green-500 dark:fill-green-400 size-3" />
            ) : status === "pending" ? (
              <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin size-3" />
            ) : (
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="text-red-500 size-3" />
            )}
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-6">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right pr-6">
          {row.original.status === "PENDING" ? (
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-[10px] font-bold rounded-lg px-3"
              onClick={() => openDialog(row.original)}
              disabled={processMutation.isPending}
            >
              Process All
            </Button>
          ) : (
            <div className="text-[10px] text-muted-foreground italic">Processed</div>
          )}
        </div>
      ),
    },
  ], [processMutation]);

  const table = useReactTable({
    data: tableData,
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

  const handleStatusChange = (val: string | null) => {
    if (val) {
      setStatus(val);
      setPage(1);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">

      <Tabs
        value={status}
        onValueChange={handleStatusChange}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={status} onValueChange={handleStatusChange}>
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

            <TabsList className="hidden lg:flex **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
              <TabsTrigger value="ALL">All Requests</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by user..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 w-48 lg:w-64"
              />
            </div>

            <Button variant="outline" size="sm">
              <HugeiconsIcon icon={FilterIcon} strokeWidth={2} />
              <span className="hidden lg:inline">Filters</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} data-icon="inline-start" />
                <span className="hidden lg:inline">Columns</span>
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
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

        <div className="relative flex flex-col gap-4">
          <div className="overflow-x-auto border rounded-2xl">
            <Table className="min-w-[800px]">
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
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !tableData || tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No withdrawal requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {data?.pagination?.total || 0} users selected.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
                <Select value={`${pageSize}`} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[10, 20, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {page} of {data?.pagination?.totalPages || 1}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(1)} disabled={page === 1}>
                  <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(p => Math.min(data?.pagination?.totalPages || 1, p + 1))} disabled={page === (data?.pagination?.totalPages || 1)}>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Button>
                <Button variant="outline" className="size-8" size="icon" onClick={() => setPage(data?.pagination?.totalPages || 1)} disabled={page === (data?.pagination?.totalPages || 1)}>
                  <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={MoneySend01Icon} size={20} />
              Process All Withdrawals
            </DialogTitle>
            <DialogDescription>
              {selectedUserGroup?.user?.name} - {selectedUserGroup?.request_count} requests - Pending: {formatCurrency(selectedUserGroup?.pending_amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(selectedUserGroup?.user?.upi_id || selectedUserGroup?.user?.bank_name) && (
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Tabs value={withdrawalForm.payment_method} onValueChange={(v) => setWithdrawalForm(prev => ({ ...prev, payment_method: v as "UPI" | "BANK" }))} className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    {selectedUserGroup?.user?.upi_id && <TabsTrigger value="UPI">UPI</TabsTrigger>}
                    {selectedUserGroup?.user?.bank_name && <TabsTrigger value="BANK">Bank Transfer</TabsTrigger>}
                  </TabsList>
                  {selectedUserGroup?.user?.upi_id && (
                    <TabsContent value="UPI">
                      <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center gap-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pay via UPI</p>
                        <Image
                          src={qrUrl || ""}
                          alt="UPI QR Code"
                          width={150}
                          height={150}
                          className="rounded-md shadow-sm bg-white p-2 object-contain mix-blend-multiply"
                        />
                        <p className="text-xs font-medium text-center">{selectedUserGroup.user.upi_id}</p>
                        <p className="text-[10px] text-muted-foreground text-center">Scan to pay exactly {formatCurrency(selectedUserGroup.pending_amount)}</p>
                      </div>
                    </TabsContent>
                  )}
                  {selectedUserGroup?.user?.bank_name && (
                    <TabsContent value="BANK">
                      <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bank:</span>
                          <span className="font-medium">{selectedUserGroup.user.bank_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Beneficiary:</span>
                          <span className="font-medium">{selectedUserGroup.user.beneficiary_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account:</span>
                          <span className="font-medium">XXXX{selectedUserGroup.user.account_number?.slice(-4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IFSC:</span>
                          <span className="font-medium">{selectedUserGroup.user.ifsc_code}</span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                          <span>Amount to Transfer:</span>
                          <span className="text-green-600">{formatCurrency(selectedUserGroup.pending_amount)}</span>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={withdrawalForm.status}
                onValueChange={(v) => v && setWithdrawalForm(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {withdrawalForm.status === "APPROVED" && (
              <div className="space-y-2">
                <Label>Reference ID (Optional)</Label>
                <Input
                  value={withdrawalForm.reference_id}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, reference_id: e.target.value }))}
                  placeholder="Transaction reference ID"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={processMutation.isPending}>
              {processMutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" size={16} />
                  Processing...
                </>
              ) : (
                "Process All Requests"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}