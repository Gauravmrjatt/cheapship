"use client";

import * as React from "react";
import { Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  Loading03Icon,
  CheckmarkCircle01Icon,
  SearchIcon,
  FilterIcon,
  LeftToRightListBulletIcon,
  ArrowDown01Icon,
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  Location01Icon,
  Calendar01Icon,
  MoneyReceiveCircleIcon,
} from "@hugeicons/core-free-icons";
import { useHttp } from "@/lib/hooks/use-http";
import { sileo } from "sileo";

interface CODOrder {
  id: string;
  order_type: string;
  shipment_status: string;
  payment_mode: string;
  cod_amount: number;
  remittance_status: string;
  remitted_amount: number | null;
  remitted_at: string | null;
  remittance_ref_id: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  order_receiver_address?: {
    name: string;
    city: string;
    state: string;
  };
}

function CODOrdersContent() {
  const http = useHttp();
  const queryClient = useQueryClient();

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
  const [selectedOrder, setSelectedOrder] = React.useState<CODOrder | null>(null);
  const [showRemittanceDialog, setShowRemittanceDialog] = React.useState(false);
  const [remittanceForm, setRemittanceForm] = React.useState({
    remittance_status: "REMITTED",
    remitted_amount: "",
    remittance_ref_id: "",
  });

  const { data, isLoading } = useQuery<{
    data: CODOrder[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
    summary: {
      totalPendingCOD: number;
      totalRemitted: number;
    };
  }>(
    http.get(
      ["admin-cod-orders", page, pageSize, statusFilter, search],
      `/admin/cod-orders?page=${page}&pageSize=${pageSize}&remittance_status=${statusFilter}${search ? `&search=${search}` : ""}`,
      true
    )
  );

  const updateRemittanceMutation = useMutation(
    http.patch(`/admin/orders/${selectedOrder?.id}/remittance`, {
      onSuccess: () => {
        sileo.success({ title: "Success", description: "Remittance status updated" });
        queryClient.invalidateQueries({ queryKey: ["admin-cod-orders"] });
        setShowRemittanceDialog(false);
        setSelectedOrder(null);
      },
      onError: (error: Error) => {
        sileo.error({ title: "Error", description: error.message || "Failed to update remittance" });
      },
    })
  );

  const handleStatusChange = (status: string | null) => {
    if (status) {
      setStatusFilter(status);
      setPage(1);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openRemittanceDialog = (order: CODOrder) => {
    setSelectedOrder(order);
    setRemittanceForm({
      remittance_status: order.remittance_status || "REMITTED",
      remitted_amount: order.cod_amount?.toString() || "",
      remittance_ref_id: order.remittance_ref_id || "",
    });
    setShowRemittanceDialog(true);
  };

  const handleUpdateRemittance = () => {
    if (!selectedOrder) return;
    updateRemittanceMutation.mutate({
      remittance_status: remittanceForm.remittance_status,
      remitted_amount: parseFloat(remittanceForm.remitted_amount) || undefined,
      remittance_ref_id: remittanceForm.remittance_ref_id || undefined,
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRemittanceBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; className: string }> = {
      PENDING: { variant: "secondary", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
      PROCESSING: { variant: "secondary", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
      REMITTED: { variant: "secondary", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
      FAILED: { variant: "destructive", className: "" },
      NOT_APPLICABLE: { variant: "outline", className: "text-muted-foreground" },
    };
    const c = config[status] || { variant: "outline", className: "" };
    return (
      <Badge variant={c.variant} className={`${c.className} capitalize text-xs`}>
        {status?.toLowerCase().replace(/_/g, " ")}
      </Badge>
    );
  };

  const tableData = data?.data || [];
  const allColumns = [
    { id: "id", label: "Order ID" },
    { id: "user", label: "User" },
    { id: "receiver", label: "Receiver" },
    { id: "cod_amount", label: "COD Amount" },
    { id: "remittance_status", label: "Remittance" },
    { id: "remitted_amount", label: "Remitted" },
    { id: "created_at", label: "Order Date" },
    { id: "actions", label: "Actions" },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HugeiconsIcon icon={Wallet01Icon} size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">COD Orders Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage Cash on Delivery remittances
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Remittance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(data?.summary?.totalPendingCOD || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Remitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data?.summary?.totalRemitted || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total COD Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-2xl font-bold">{data?.pagination?.total || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="flex w-fit lg:hidden" size="sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="REMITTED">Remitted</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="hidden lg:flex items-center gap-2">
            {["ALL", "PENDING", "PROCESSING", "REMITTED", "FAILED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange(status)}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden w-64 lg:block">
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-9 h-8"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} data-icon="inline-start" />
              <span className="hidden lg:inline">Columns</span>
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {allColumns.filter(c => c.id !== "id" && c.id !== "actions").map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={columnVisibility[column.id] !== false}
                  onCheckedChange={(v) => setColumnVisibility(prev => ({ ...prev, [column.id]: v }))}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative flex flex-col gap-4">
        <div className="overflow-x-auto border rounded-2xl">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>Order ID</TableHead>
                {columnVisibility["user"] !== false && <TableHead>User</TableHead>}
                {columnVisibility["receiver"] !== false && <TableHead>Receiver</TableHead>}
                {columnVisibility["cod_amount"] !== false && <TableHead>COD Amount</TableHead>}
                {columnVisibility["remittance_status"] !== false && <TableHead>Remittance</TableHead>}
                {columnVisibility["remitted_amount"] !== false && <TableHead>Remitted</TableHead>}
                {columnVisibility["created_at"] !== false && <TableHead>Order Date</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No COD orders found.
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.id.toString().slice(0, 8)}
                    </TableCell>
                    {columnVisibility["user"] !== false && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{order.user?.name}</span>
                          <span className="text-[10px] text-muted-foreground">{order.user?.email}</span>
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility["receiver"] !== false && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs">{order.order_receiver_address?.name || "-"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {order.order_receiver_address?.city}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility["cod_amount"] !== false && (
                      <TableCell className="font-semibold">
                        {formatCurrency(order.cod_amount)}
                      </TableCell>
                    )}
                    {columnVisibility["remittance_status"] !== false && (
                      <TableCell>
                        {getRemittanceBadge(order.remittance_status)}
                      </TableCell>
                    )}
                    {columnVisibility["remitted_amount"] !== false && (
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(order.remitted_amount)}
                      </TableCell>
                    )}
                    {columnVisibility["created_at"] !== false && (
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={Calendar01Icon} size={14} />
                          {formatDate(order.created_at)}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRemittanceDialog(order)}
                      >
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {data?.pagination?.total || 0} total orders
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
              <Select value={`${pageSize}`} onValueChange={(v) => setPageSize(Number(v))}>
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

      <Dialog open={showRemittanceDialog} onOpenChange={setShowRemittanceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={MoneyReceiveCircleIcon} size={20} />
              Update Remittance Status
            </DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id?.toString().slice(0, 8)} - COD Amount: {formatCurrency(selectedOrder?.cod_amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Remittance Status</Label>
              <Select
                value={remittanceForm.remittance_status}
                onValueChange={(v) => setRemittanceForm(prev => ({ ...prev, remittance_status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="REMITTED">Remitted</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {remittanceForm.remittance_status === "REMITTED" && (
              <>
                <div className="space-y-2">
                  <Label>Remitted Amount</Label>
                  <Input
                    type="number"
                    value={remittanceForm.remitted_amount}
                    onChange={(e) => setRemittanceForm(prev => ({ ...prev, remitted_amount: e.target.value }))}
                    placeholder="Enter remitted amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference ID (Optional)</Label>
                  <Input
                    value={remittanceForm.remittance_ref_id}
                    onChange={(e) => setRemittanceForm(prev => ({ ...prev, remittance_ref_id: e.target.value }))}
                    placeholder="Transaction reference ID"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemittanceDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRemittance}
              disabled={updateRemittanceMutation.isPending}
            >
              {updateRemittanceMutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" size={16} />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminCODOrdersPage() {
  return (
    <Suspense fallback={
      <div className="w-full space-y-6 py-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    }>
      <CODOrdersContent />
    </Suspense>
  );
}
