"use client";

import * as React from "react";
import { Suspense } from "react";
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
import { useAdminOrders } from "@/lib/hooks/use-admin";
import { useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  SearchIcon, 
  Loading03Icon, 
  CheckmarkCircle01Icon, 
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  FilterIcon,
  LeftToRightListBulletIcon,
  ArrowDown01Icon,
  DeliveryTruck01Icon,
} from "@hugeicons/core-free-icons";

function OrdersContent() {
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get("userId") || "";
  
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const userIdFilter = userIdFromQuery;
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const { data, isLoading } = useAdminOrders(page, pageSize, statusFilter, search, userIdFilter);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const tableData = React.useMemo(() => data?.data || [], [data?.data]);

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
      accessorKey: "id",
      header: "Shipment ID",
      cell: ({ row }) => (
        <span className="text-foreground font-medium uppercase">
          #{row.original.id.toString().slice(0, 8)}
        </span>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "user.name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">{row.original.user?.name}</span>
          <span className="text-[10px] text-muted-foreground">{row.original.user?.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "courier_name",
      header: "Courier",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{row.original.courier_name || "N/A"}</span>
          <Badge variant="outline" className="text-[9px] uppercase font-bold py-0">{row.original.shipment_type}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "shipment_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.shipment_status.toLowerCase();
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
            {status === "delivered" ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="fill-green-500 dark:fill-green-400 size-3" />
            ) : status === "pending" || status === "processing" ? (
              <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin size-3" />
            ) : (
              <HugeiconsIcon icon={DeliveryTruck01Icon} strokeWidth={2} className=" size-3" />
            )}
            {status.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "total_amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums font-bold text-xs">
          ₹{Number(row.original.total_amount).toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-[10px] text-muted-foreground font-medium">
          {new Date(row.original.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      ),
    },
  ], []);

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

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 px-4 lg:px-6">
        <p className="text-muted-foreground">
          {userIdFilter 
            ? `Viewing orders for user ID: ${userIdFilter}` 
            : ""}
        </p>
      </div>
     
      <Tabs
        value={statusFilter}
        onValueChange={handleStatusChange}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="flex w-fit lg:hidden" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All Orders</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <TabsList className="hidden lg:flex **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
              <TabsTrigger value="ALL">All Orders</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="IN_TRANSIT">In Transit</TabsTrigger>
              <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
              <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
            </TabsList>
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

        <div className="relative flex flex-col gap-4 overflow-auto  ">
          <div className="overflow-hidden border rounded-2xl">
            <Table>
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
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {data?.pagination?.total || 0} orders selected.
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
      </Tabs>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
