"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TicketIcon,
  UserIcon,
  MailIcon,
  CallIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "@/lib/hooks/use-http";
import { sileo } from "sileo";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    mobile: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function getStatusColor(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "RESOLVED":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "CLOSED":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupportTicketsPage() {
  const http = useHttp();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const params = new URLSearchParams();
  if (statusFilter !== "ALL") {
    params.set("status", statusFilter);
  }
  params.set("page", currentPage.toString());
  params.set("limit", "20");

  const { data, isLoading } = useQuery(
    http.get(["admin-tickets", statusFilter, currentPage], `/support/tickets/admin/all?${params.toString()}`)
  );

  const tickets: Ticket[] = data?.data || [];
  const pagination: PaginationInfo = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const updateStatusMutation = useMutation({
    ...http.patch(`/support/tickets/admin/${selectedTicket?.id}/status`, {
      onSuccess: () => {
        sileo.success({ title: "Ticket status updated!" });
        queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        if (selectedTicket) {
          setSelectedTicket({ ...selectedTicket, status: selectedTicket.status });
        }
      },
    }),
  });

  const handleStatusChange = (newStatus: string | null) => {
    if (newStatus && selectedTicket) {
      updateStatusMutation.mutate({ status: newStatus });
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HugeiconsIcon icon={TicketIcon} size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">
            View and manage support tickets from users
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">All Tickets</CardTitle>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || "ALL"); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-3 bg-muted rounded-full mb-3 mx-auto w-fit">
                    <HugeiconsIcon icon={TicketIcon} size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No tickets found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTicket?.id === ticket.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{ticket.subject}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <HugeiconsIcon icon={UserIcon} size={12} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{ticket.user.name}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{formatDate(ticket.created_at)}</span>
                            </div>
                          </div>
                          <Badge className={`shrink-0 ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={pagination.page === 1}
                        >
                          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedTicket ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Subject</label>
                  <p className="font-medium text-sm mt-1">{selectedTicket.subject}</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Message</label>
                  <div className="mt-1 p-3 bg-muted/30 rounded-lg text-sm">
                    {selectedTicket.message}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">User Name</label>
                    <div className="flex items-center gap-1 mt-1">
                      <HugeiconsIcon icon={UserIcon} size={14} className="text-muted-foreground" />
                      <span className="text-sm">{selectedTicket.user.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <div className="flex items-center gap-1 mt-1">
                      <HugeiconsIcon icon={MailIcon} size={14} className="text-muted-foreground" />
                      <span className="text-sm truncate">{selectedTicket.user.email}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Phone</label>
                    <div className="flex items-center gap-1 mt-1">
                      <HugeiconsIcon icon={CallIcon} size={14} className="text-muted-foreground" />
                      <span className="text-sm">{selectedTicket.user.mobile}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                  Created: {formatDate(selectedTicket.created_at)}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <div className="p-3 bg-muted rounded-full mb-3 mx-auto w-fit">
                  <HugeiconsIcon icon={TicketIcon} size={24} className="text-muted-foreground" />
                </div>
                <p className="text-sm">Select a ticket to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}