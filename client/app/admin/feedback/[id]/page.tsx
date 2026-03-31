"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Comment01Icon,
  UserIcon,
  MailIcon,
  CallIcon,
  ArrowLeftIcon,
} from "@hugeicons/core-free-icons";
import { useQuery } from "@tanstack/react-query";
import { useHttp } from "@/lib/hooks/use-http";
import { useParams, useRouter } from "next/navigation";

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

export default function FeedbackDetailPage() {
  const http = useHttp();
  const params = useParams();
  const router = useRouter();
  const feedbackId = params.id as string;

  const { data, isLoading } = useQuery(
    http.get(["feedback-detail", feedbackId], `/feedback/${feedbackId}`)
  );

  const feedback: Feedback = data?.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <HugeiconsIcon icon={ArrowLeftIcon} size={20} />
        </Button>
        <div className="p-2 bg-primary/10 rounded-lg">
          <HugeiconsIcon icon={Comment01Icon} size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback Details</h1>
          <p className="text-sm text-muted-foreground">
            View feedback details
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading feedback...</div>
      ) : feedback ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Message</CardTitle>
                  <Badge className={`${getTypeColor(feedback.type)}`}>
                    {feedback.type === "FEEDBACK" ? "Feedback" : "Complaint"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Subject</label>
                  <p className="font-medium text-sm mt-1">{feedback.subject}</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Message</label>
                  <div className="mt-1 p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                    {feedback.message}
                  </div>
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                  Submitted on: {formatDate(feedback.created_at)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <div className="flex items-center gap-2 mt-1">
                    <HugeiconsIcon icon={UserIcon} size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{feedback.user.name}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <HugeiconsIcon icon={MailIcon} size={14} className="text-muted-foreground" />
                    <a href={`mailto:${feedback.user.email}`} className="text-sm hover:underline">
                      {feedback.user.email}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <HugeiconsIcon icon={CallIcon} size={14} className="text-muted-foreground" />
                    <a href={`tel:${feedback.user.mobile}`} className="text-sm hover:underline">
                      {feedback.user.mobile}
                    </a>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4"
                  onClick={() => window.open(`mailto:${feedback.user.email}?subject=Re: ${feedback.subject}`, '_blank')}
                >
                  Reply via Email
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Feedback not found</p>
        </div>
      )}
    </div>
  );
}
