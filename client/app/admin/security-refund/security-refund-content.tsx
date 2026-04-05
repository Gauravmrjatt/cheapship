"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useSecurityRefundSchedule, useSetSecurityRefundSchedule, useAdminSecurityDeposits, AdminSecurityDeposit } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Wallet01Icon, 
  RefreshIcon,
  Calendar02Icon,
  Loading03Icon,
  PulseIcon,
  InformationCircleIcon
} from "@hugeicons/core-free-icons";
import { sileo } from "sileo";
import { Switch } from "@/components/ui/switch";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";

export default function SecurityManagementContent() {
  const [activeTab, setActiveTab] = useState("deposits");
  
  // Schedule state
  const { data: schedule, isLoading: scheduleLoading, refetch: refetchSchedule } = useSecurityRefundSchedule();
  const setScheduleMutation = useSetSecurityRefundSchedule();
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [isActive, setIsActive] = useState(true);

  // Deposits state
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const { data: depositsData, isLoading: depositsLoading, refetch: refetchDeposits } = useAdminSecurityDeposits(page, 20, statusFilter);

  useEffect(() => {
    if (schedule) {
      const dateObj = new Date(schedule.scheduled_date);
      setScheduledDate(dateObj.toISOString().split('T')[0]);
      setScheduledTime(dateObj.toTimeString().slice(0, 5));
      setIsActive(schedule.is_active);
    }
  }, [schedule]);

  const handleSaveSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      sileo.error({ title: "Error", description: "Please select both date and time" });
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    try {
      await setScheduleMutation.mutateAsync({
        scheduled_date: scheduledDateTime,
        is_active: isActive
      });
      sileo.success({ title: "Success", description: "Security refund schedule saved" });
      refetchSchedule();
    } catch (error) {
      console.error("Error saving schedule:", error);
      sileo.error({ title: "Error", description: "Failed to save schedule" });
    }
  };

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value || "");
    setPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partial</Badge>;
      case 'FULLY_USED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Fully Used</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getScheduleStatusBadge = (isActive: boolean, lastTriggered: string | null) => {
    if (!isActive && lastTriggered) {
      return <Badge className="bg-green-100 text-green-700 border-green-200">Triggered</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Badge>;
  };

  // Table columns for deposits
  const depositColumns = useMemo<ColumnDef<AdminSecurityDeposit>[]>(() => [
    {
      accessorKey: "order_id",
      header: "Order ID",
      cell: ({ row }) => (
        <span className="font-medium">#{row.original.order_id.toString()}</span>
      )
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.user?.name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">{row.original.user?.mobile || ''}</span>
        </div>
      )
    },
    {
      accessorKey: "order.shipment_status",
      header: "Order Status",
      cell: ({ row }) => <span>{row.original.order?.shipment_status || '-'}</span>
    },
    {
      accessorKey: "amount",
      header: "Original",
      cell: ({ row }) => <span>₹{Number(row.original.amount).toLocaleString()}</span>
    },
    {
      accessorKey: "used_amount",
      header: "Used",
      cell: ({ row }) => <span className="text-red-600">-₹{Number(row.original.used_amount).toLocaleString()}</span>
    },
    {
      accessorKey: "remaining",
      header: "Remaining",
      cell: ({ row }) => <span className="text-green-600 font-medium">₹{Number(row.original.remaining).toLocaleString()}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatDate(row.original.created_at)}</span>
    }
  ], []);

  const depositsTable = useReactTable({
    data: depositsData?.data || [],
    columns: depositColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    pageCount: depositsData?.pagination?.totalPages || 1,
    manualPagination: true,
  });

  return (
    <div className="space-y-6">
   

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="deposits">Security Deposits</TabsTrigger>
          <TabsTrigger value="schedule">Refund Schedule</TabsTrigger>
        </TabsList>

        {/* Deposits Tab */}
        <TabsContent value="deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HugeiconsIcon icon={Wallet01Icon} />
                All Security Deposits
              </CardTitle>
              <CardDescription>
                Complete list of security deposits with usage tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="FULLY_USED">Fully Used</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {depositsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : depositsData?.data && depositsData.data.length > 0 ? (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        {depositsTable.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id} className="hover:bg-transparent">
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id} className="text-xs font-medium uppercase text-muted-foreground">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {depositsTable.getRowModel().rows.map((row) => (
                          <TableRow key={row.id} className="hover:bg-muted/50">
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="py-3">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {depositsData.pagination && depositsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((depositsData.pagination.currentPage - 1) * depositsData.pagination.pageSize) + 1} to{' '}
                        {Math.min(depositsData.pagination.currentPage * depositsData.pagination.pageSize, depositsData.pagination.total)} of{' '}
                        {depositsData.pagination.total} results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {depositsData.pagination.currentPage} of {depositsData.pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => p + 1)}
                          disabled={page >= depositsData.pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <HugeiconsIcon icon={Wallet01Icon} className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No security deposits found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          {/* Create Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HugeiconsIcon icon={PulseIcon} />
                Create New Schedule
              </CardTitle>
              <CardDescription>
                Set a date and time to trigger automatic security deposit refunds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    disabled={setScheduleMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    disabled={setScheduleMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      disabled={setScheduleMutation.isPending}
                    />
                    <span className="text-sm text-muted-foreground">
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={handleSaveSchedule} 
                    disabled={setScheduleMutation.isPending}
                    className="w-full"
                  >
                    {setScheduleMutation.isPending ? (
                      <>
                        <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={PulseIcon} className="mr-2 h-4 w-4" />
                        Save Schedule
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HugeiconsIcon icon={Calendar02Icon} />
                Schedule History
              </CardTitle>
              <CardDescription>
                View all security refund schedules and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  ))}
                </div>
              ) : schedule ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-medium uppercase text-muted-foreground">Scheduled Date & Time</TableHead>
                        <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-medium uppercase text-muted-foreground">Last Triggered</TableHead>
                        <TableHead className="text-xs font-medium uppercase text-muted-foreground">Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="font-medium py-3">
                          {formatDate(schedule.scheduled_date)}
                        </TableCell>
                        <TableCell className="py-3">
                          {getScheduleStatusBadge(schedule.is_active, schedule.last_triggered_at)}
                        </TableCell>
                        <TableCell className="py-3">
                          {schedule.last_triggered_at ? (
                            <span className="text-green-600">
                              {formatDate(schedule.last_triggered_at)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not triggered yet</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground py-3">
                          {formatDate(schedule.created_at)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <HugeiconsIcon icon={Calendar02Icon} className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No schedule history found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a schedule above to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HugeiconsIcon icon={InformationCircleIcon} />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Set Schedule</p>
                    <p className="text-xs text-muted-foreground">
                      Choose date and time for automatic refund trigger
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">System Monitors</p>
                    <p className="text-xs text-muted-foreground">
                      Cron job runs every minute to check scheduled time
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Refund Process</p>
                    <p className="text-xs text-muted-foreground">
                      Security remaining deposits are refunded to main wallet
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-green-700">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Auto-Deactivate</p>
                    <p className="text-xs text-muted-foreground">
                      Schedule becomes inactive after triggering
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-700">5</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Transaction Records</p>
                    <p className="text-xs text-muted-foreground">
                      All refunds are logged in transaction history
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-700">6</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Repeat</p>
                    <p className="text-xs text-muted-foreground">
                      Create new schedule for next refund cycle
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}