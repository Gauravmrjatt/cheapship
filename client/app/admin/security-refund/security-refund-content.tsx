"use client";

import * as React from "react";
import { useState } from "react";
import { useSecurityRefundSchedule, useSetSecurityRefundSchedule } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Calendar02Icon, 
  Time02Icon, 
  InformationCircleIcon,
  CheckmarkCircle02Icon,
  CodeCircleIcon,
  Loading03Icon,
  RefreshIcon,
  PulseIcon
} from "@hugeicons/core-free-icons";
import { sileo } from "sileo";
import { Switch } from "@/components/ui/switch";
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

interface ScheduleData {
  id: string;
  scheduled_date: string;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function SecurityRefundContent() {
  const { data: schedule, isLoading, refetch } = useSecurityRefundSchedule();
  const setScheduleMutation = useSetSecurityRefundSchedule();

  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [isActive, setIsActive] = useState(true);

  React.useEffect(() => {
    if (schedule) {
      const dateObj = new Date(schedule.scheduled_date);
      setScheduledDate(dateObj.toISOString().split('T')[0]);
      setScheduledTime(dateObj.toTimeString().slice(0, 5));
      setIsActive(schedule.is_active);
    }
  }, [schedule]);

  const handleSave = async () => {
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
      refetch();
    } catch (error) {
      console.error("Error saving schedule:", error);
      sileo.error({ title: "Error", description: "Failed to save schedule" });
    }
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

  const getStatusBadge = (isActive: boolean, lastTriggered: string | null) => {
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
    

      {/* Create New Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                onClick={handleSave} 
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

      {/* Schedule History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Calendar02Icon} />
            Schedule History
          </CardTitle>
          <CardDescription>
            View all security refund schedules and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scheduled Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">
                    {formatDate(schedule.scheduled_date)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(schedule.is_active, schedule.last_triggered_at)}
                  </TableCell>
                  <TableCell>
                    {schedule.last_triggered_at ? (
                      <span className="text-green-600">
                        {formatDate(schedule.last_triggered_at)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not triggered yet</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(schedule.created_at)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
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
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={InformationCircleIcon} />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">1</span>
              </div>
              <div>
                <p className="font-medium">Set Schedule</p>
                <p className="text-sm text-muted-foreground">
                  Choose date and time for automatic refund trigger
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">2</span>
              </div>
              <div>
                <p className="font-medium">System Monitors</p>
                <p className="text-sm text-muted-foreground">
                  Cron job runs every minute to check scheduled time
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">3</span>
              </div>
              <div>
                <p className="font-medium">Refund Process</p>
                <p className="text-sm text-muted-foreground">
                  Security deposits from delivered orders are refunded to main wallet
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-sm font-medium text-green-700">4</span>
              </div>
              <div>
                <p className="font-medium">Auto-Deactivate</p>
                <p className="text-sm text-muted-foreground">
                  Schedule becomes inactive after triggering
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-sm font-medium text-purple-700">5</span>
              </div>
              <div>
                <p className="font-medium">Transaction Records</p>
                <p className="text-sm text-muted-foreground">
                  All refunds are logged in transaction history
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-sm font-medium text-orange-700">6</span>
              </div>
              <div>
                <p className="font-medium">Repeat</p>
                <p className="text-sm text-muted-foreground">
                  Create new schedule for next refund cycle
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}