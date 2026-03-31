"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Comment01Icon,
  UserIcon,
  MailIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightIcon,
} from "@hugeicons/core-free-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttp } from "@/lib/hooks/use-http";
import { sileo } from "sileo";
import { useRouter } from "next/navigation";

interface Feedback {
  id: string;
  subject: string;
  message: string;
  type: string;
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

function getTypeColor(type: string) {
  switch (type) {
    case "FEEDBACK":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "COMPLAINT":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
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

export default function FeedbackPage() {
  const http = useHttp();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const params = new URLSearchParams();
  if (typeFilter !== "ALL") {
    params.set("type", typeFilter);
  }
  params.set("page", currentPage.toString());
  params.set("pageSize", "20");

  const { data, isLoading } = useQuery(
    http.get(["admin-feedback", typeFilter, currentPage], `/feedback?${params.toString()}`)
  );

  const feedbacks: Feedback[] = data?.data || [];
  const pagination: PaginationInfo = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const handleRowClick = (feedback: Feedback) => {
    router.push(`/admin/feedback/${feedback.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HugeiconsIcon icon={Comment01Icon} size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback & Complaints</h1>
          <p className="text-sm text-muted-foreground">
            View and manage feedback from users
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Feedback</CardTitle>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v || "ALL"); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="FEEDBACK">Feedback</SelectItem>
                <SelectItem value="COMPLAINT">Complaint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading feedback...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-3 bg-muted rounded-full mb-3 mx-auto w-fit">
                <HugeiconsIcon icon={Comment01Icon} size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No feedback found</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Subject</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">User</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Type</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((feedback) => (
                      <tr
                        key={feedback.id}
                        className="border-t cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleRowClick(feedback)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm truncate max-w-[200px]">{feedback.subject}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={UserIcon} size={14} className="text-muted-foreground" />
                            <span className="text-sm">{feedback.user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${getTypeColor(feedback.type)}`}>
                            {feedback.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{formatDate(feedback.created_at)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-8">
                            View <HugeiconsIcon icon={ArrowRightIcon} size={14} className="ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} feedback
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
  );
}
