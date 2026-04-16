"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HelpCircleIcon,
  MailIcon,
  CallIcon,
  Clock01Icon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  TicketIcon,
  EyeIcon,
} from "@hugeicons/core-free-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useHttp } from "@/lib/hooks/use-http";
import { sileo } from "sileo";

interface FAQItem {
  question: string;
  answer: string;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I track my order?",
    answer: "Go to the Orders page and click on the track icon for your order. You'll be able to see real-time tracking updates and shipment history.",
  },
  {
    question: "How do I create a new shipment?",
    answer: "Click on 'Create Order' in the sidebar. Fill in the pickup and delivery addresses, package details, and select a courier. The system will calculate rates automatically.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept wallet balance, UPI, and bank transfers. You can add money to your wallet from the Payments section.",
  },
  {
    question: "How do I cancel an order?",
    answer: "Orders can only be cancelled if they are in 'PENDING' status. Go to your order details and click the Cancel button. The shipping charge will be refunded to your wallet.",
  },
  {
    question: "What is COD remittance?",
    answer: "For Cash on Delivery orders, the courier collects the amount and remits it back to us. We then credit it to your wallet after deducting applicable fees.",
  },
  {
    question: "How do I become a franchise partner?",
    answer: "Visit the Franchise section in your dashboard to apply. You can earn commissions on orders placed through your referral link.",
  },
  {
    question: "How are shipping rates calculated?",
    answer: "Rates are calculated based on package weight, dimensions, pickup and delivery pincode, and the courier selected. Use our Calculator to get instant quotes.",
  },
  {
    question: "What if my package is damaged or lost?",
    answer: "Please contact our support team immediately with your order ID. We will coordinate with the courier for resolution and insurance claims if applicable.",
  },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="border rounded-xl overflow-hidden bg-muted/30"
        >
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-medium text-sm pr-2">{item.question}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={16}
              className={`text-muted-foreground transition-transform shrink-0 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-sm text-muted-foreground pt-0">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
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

export default function HelpPage() {
  const http = useHttp();
  const [activeTab, setActiveTab] = useState<"raise" | "my-tickets">("raise");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery(
    http.get(["my-tickets"], "/support/tickets")
  );

  const tickets: Ticket[] = ticketsData?.data || [];

  const submitTicket = useMutation({
    ...http.post("/support/tickets", {
      onSuccess: () => {
        sileo.success({ title: "Ticket submitted successfully!" });
        setSubject("");
        setMessage("");
        setSubmitted(true);
        refetchTickets();
      },
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      sileo.error({ title: "Please fill in all fields" });
      return;
    }
    submitTicket.mutate({ subject, message });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <HugeiconsIcon icon={HelpCircleIcon} size={28} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-sm text-muted-foreground">
            Find answers or contact our support team
          </p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <FAQAccordion items={faqs} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="p-2 bg-background rounded-lg shadow-sm">
                  <HugeiconsIcon icon={MailIcon} size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">support@cheapship.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="p-2 bg-background rounded-lg shadow-sm">
                  <HugeiconsIcon icon={CallIcon} size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">+91-9509698208</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="p-2 bg-background rounded-lg shadow-sm">
                  <HugeiconsIcon icon={Clock01Icon} size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hours</p>
                  <p className="text-sm font-medium">Mon - Sat, 9 AM - 6 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Support Tickets</CardTitle>
              <div className="flex bg-muted rounded-lg p-0.5">
                <Button
                  variant={activeTab === "raise" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-3"
                  onClick={() => setActiveTab("raise")}
                >
                  <HugeiconsIcon icon={TicketIcon} size={14} className="mr-1.5" />
                  Raise
                </Button>
                <Button
                  variant={activeTab === "my-tickets" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-3"
                  onClick={() => setActiveTab("my-tickets")}
                >
                  <HugeiconsIcon icon={EyeIcon} size={14} className="mr-1.5" />
                  My Tickets
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "raise" ? (
              submitted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={32}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                  <h3 className="text-lg font-semibold">Ticket Submitted!</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-[240px]">
                    We&apos;ll get back to you within 24 hours
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-5"
                    onClick={() => {
                      setSubmitted(false);
                      setActiveTab("my-tickets");
                    }}
                  >
                    View My Tickets
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Describe your issue in detail..."
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitTicket.isPending}
                  >
                    {submitTicket.isPending ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </form>
              )
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {ticketsLoading ? (
                  <div className="text-center py-10 text-muted-foreground">
                    Loading tickets...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="p-4 bg-muted rounded-full mb-4 mx-auto w-fit">
                      <HugeiconsIcon
                        icon={TicketIcon}
                        size={28}
                        className="text-muted-foreground"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">No tickets yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("raise")}
                    >
                      Raise a Ticket
                    </Button>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                            {ticket.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(ticket.created_at)}
                          </p>
                        </div>
                        <Badge className={`shrink-0 ${getStatusColor(ticket.status)} text-[10px]`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
