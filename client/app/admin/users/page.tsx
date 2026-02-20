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
import { useAdminUsers, useToggleUserStatus, useSetUserCommissionBounds } from "@/lib/hooks/use-admin";
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
import { User } from "@/lib/store/auth";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  SearchIcon, 
  Loading03Icon, 
  CheckmarkCircle01Icon, 
  Cancel01Icon,
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  UserBlock01Icon,
  FilterIcon,
  LeftToRightListBulletIcon,
  ArrowDown01Icon,
  PercentIcon,
  MinimizeIcon,
  MaximizeIcon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const router = useRouter();
  const isMounted = React.useRef(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const { data, isLoading } = useAdminUsers(page, pageSize, search, statusFilter);
  const toggleStatusMutation = useToggleUserStatus(isMounted);
  const setUserBoundsMutation = useSetUserCommissionBounds(isMounted);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Commission bounds sheet state
  const [boundsSheetOpen, setBoundsSheetOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = React.useState<string>("");
  const [minRate, setMinRate] = React.useState<number>(0);
  const [maxRate, setMaxRate] = React.useState<number>(100);

  const handleToggleStatus = (userId: string, currentStatus?: boolean) => {
    if (currentStatus === undefined || confirm(`Are you sure you want to ${currentStatus ? 'block' : 'unblock'} this user?`)) {
      toggleStatusMutation.mutate({ userId, is_active: !currentStatus });
    }
  };

  const handleOpenBoundsSheet = (userId: string, userName: string, currentMin?: number, currentMax?: number) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setMinRate(currentMin ?? 0);
    setMaxRate(currentMax ?? 100);
    setBoundsSheetOpen(true);
  };

  const handleSaveBounds = () => {
    if (selectedUserId) {
      setUserBoundsMutation.mutate({ 
        userId: selectedUserId, 
        min_rate: minRate, 
        max_rate: maxRate 
      });
      setBoundsSheetOpen(false);
    }
  };

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

  const tableData = React.useMemo(() => data?.data || [], [data?.data]);

  const columns = React.useMemo<ColumnDef<User>[]>(() => [
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
              <DropdownMenuItem 
                onClick={() => handleOpenBoundsSheet(
                  row.original.id, 
                  row.original.name,
                  row.original.min_commission_rate ? parseFloat(row.original.min_commission_rate) : undefined,
                  row.original.max_commission_rate ? parseFloat(row.original.max_commission_rate) : undefined
                )}
              >
                <HugeiconsIcon icon={PercentIcon} size={14} className="mr-2" />
                Set Commission Bounds
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/transactions?userId=${row.original.id}`)}>
                View Transactions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/orders?userId=${row.original.id}`)}>
                View Orders
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [toggleStatusMutation]);

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
                  <SelectItem value="ALL">All Users</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <TabsList className="hidden lg:flex **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
              <TabsTrigger value="ALL">All Users</TabsTrigger>
              <TabsTrigger value="ACTIVE">Active</TabsTrigger>
              <TabsTrigger value="BLOCKED">Blocked</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden w-64 lg:block">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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

        <div className="relative flex flex-col gap-4">
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

          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {data?.pagination?.total || 0} users selected.
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

      {/* Commission Bounds Sheet */}
      <Sheet open={boundsSheetOpen} onOpenChange={setBoundsSheetOpen}>
        <SheetContent side="right" className="min-w-dvw md:min-w-[400px] flex flex-col h-full p-0">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <HugeiconsIcon icon={PercentIcon} size={20} />
              </div>
              <div>
                <SheetTitle className="text-xl">Set Commission Bounds</SheetTitle>
                <SheetDescription>For {selectedUserName}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">What are commission bounds?</p>
              <p>These bounds limit what commission rates {selectedUserName} can set for their referred franchises. The user will only be able to assign rates within this range.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-min-rate" className="text-sm font-medium">
                  Minimum Rate (%)
                </Label>
                <div className="relative">
                  <Input 
                    id="admin-min-rate"
                    type="number" 
                    value={minRate} 
                    onChange={(e) => setMinRate(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min={0}
                    max={100}
                    className="h-12 text-lg font-semibold pr-12 focus-visible:ring-1"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <HugeiconsIcon icon={MinimizeIcon} size={18} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-max-rate" className="text-sm font-medium">
                  Maximum Rate (%)
                </Label>
                <div className="relative">
                  <Input 
                    id="admin-max-rate"
                    type="number" 
                    value={maxRate} 
                    onChange={(e) => setMaxRate(parseFloat(e.target.value) || 0)}
                    placeholder="100"
                    min={0}
                    max={100}
                    className="h-12 text-lg font-semibold pr-12 focus-visible:ring-1"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <HugeiconsIcon icon={MaximizeIcon} size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="p-6 border-t mt-auto">
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1 h-11" 
                onClick={() => setBoundsSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-11 font-bold" 
                onClick={handleSaveBounds}
                disabled={setUserBoundsMutation.isPending}
              >
                {setUserBoundsMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                    Saving...
                  </div>
                ) : (
                  "Save Bounds"
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
