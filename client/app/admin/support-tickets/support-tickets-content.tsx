"use client";

import { useState } from "react";
import { useAdminSupportTickets, SupportTicketFilters } from "@/lib/hooks/use-admin-support-tickets";
import { AdminSupportTicketsDataTable } from "@/components/admin-support-tickets-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { TicketIcon, UserIcon, MailIcon, CallIcon } from "@hugeicons/core-free-icons";
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
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filters, setFilters] = useState<SupportTicketFilters>({
    status: "ALL",
    search: "",
  });

  const { data, isLoading, isError } = useAdminSupportTickets(page, pageSize, filters);

  const updateStatusMutation = useMutation({
    ...http.patch(`/support/tickets/admin/${selectedTicket?.id}/status`, {
      onSuccess: () => {
        sileo.success({ title: "Ticket status updated!" });
        queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
        if (selectedTicket) {
          setSelectedTicket({ ...selectedTicket, status: selectedTicket.status });
        }
      },
    }),
  });

  const handleFilterChange = (newFilters: SupportTicketFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleRowClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleStatusChange = (newStatus: string | null) => {
    if (newStatus && selectedTicket) {
      updateStatusMutation.mutate({ status: newStatus });
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  if (isError) return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <p className="text-destructive">Error fetching tickets</p>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="grid gap-6 lg:grid-cols-3 flex-1">
        <div className="lg:col-span-2">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4">
              <AdminSupportTicketsDataTable
                data={data?.data ?? []}
                isLoading={isLoading}
                filters={filters}
                onFilterChange={handleFilterChange}
                pagination={{
                  currentPage: page,
                  pageSize,
                  totalPages: data?.pagination?.totalPages ?? 1,
                  total: data?.pagination?.total ?? 0,
                }}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRowClick={handleRowClick}
                selectedId={selectedTicket?.id}
              />
            </div>
          </div>
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
