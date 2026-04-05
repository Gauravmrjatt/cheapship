"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useSecurityRefundSchedule, useSetSecurityRefundSchedule, useAdminSecurityDeposits } from "@/lib/hooks/use-admin";
import { AdminSecurityDepositsDataTable } from "@/components/admin-security-deposits-data-table";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";

export default function SecurityManagementContent() {
  const [activeTab, setActiveTab] = useState("deposits");

  const { data: schedule, isLoading: scheduleLoading, refetch: refetchSchedule } = useSecurityRefundSchedule();
  const setScheduleMutation = useSetSecurityRefundSchedule();
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [isActive, setIsActive] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const { data: depositsData, isLoading: depositsLoading, refetch: refetchDeposits } = useAdminSecurityDeposits(page, pageSize, filters.status);

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

  const handleFilterChange = (newFilters: { status?: string; search?: string }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
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

  const getScheduleStatusBadge = (isActive: boolean, lastTriggered: string | null) => {
    if (!isActive && lastTriggered) {
      return <Badge className="bg-green-100 text-green-700 border-green-200">Triggered</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="deposits">Security Deposits</TabsTrigger>
          <TabsTrigger value="schedule">Refund Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="deposits" className="space-y-4">
          <AdminSecurityDepositsDataTable
            data={depositsData?.data ?? []}
            isLoading={depositsLoading}
            filters={filters}
            onFilterChange={handleFilterChange}
            pagination={{
              currentPage: page,
              pageSize,
              totalPages: depositsData?.pagination?.totalPages ?? 1,
              total: depositsData?.pagination?.total ?? 0,
            }}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />

        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
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
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="hover:bg-transparent">
                        <th className="text-left text-xs font-medium uppercase text-muted-foreground px-4 py-3">Scheduled Date & Time</th>
                        <th className="text-left text-xs font-medium uppercase text-muted-foreground px-4 py-3">Status</th>
                        <th className="text-left text-xs font-medium uppercase text-muted-foreground px-4 py-3">Last Triggered</th>
                        <th className="text-left text-xs font-medium uppercase text-muted-foreground px-4 py-3">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-muted/50">
                        <td className="font-medium px-4 py-3">
                          {formatDate(schedule.scheduled_date)}
                        </td>
                        <td className="px-4 py-3">
                          {getScheduleStatusBadge(schedule.is_active, schedule.last_triggered_at)}
                        </td>
                        <td className="px-4 py-3">
                          {schedule.last_triggered_at ? (
                            <span className="text-green-600">
                              {formatDate(schedule.last_triggered_at)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not triggered yet</span>
                          )}
                        </td>
                        <td className="text-muted-foreground px-4 py-3">
                          {formatDate(schedule.created_at)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
