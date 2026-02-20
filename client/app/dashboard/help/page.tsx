"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HelpCircleIcon,
  EmailIcon,
  CallIcon,
  Clock01Icon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { useMutation } from "@tanstack/react-query";
import { useHttp } from "@/lib/hooks/use-http";
import { sileo } from "sileo";

interface FAQItem {
  question: string;
  answer: string;
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
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="border rounded-xl overflow-hidden"
        >
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-medium text-sm">{item.question}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={16}
              className={`text-muted-foreground transition-transform ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HelpPage() {
  const http = useHttp();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitTicket = useMutation({
    ...http.post("/support/tickets", {
      onSuccess: () => {
        sileo.success({ title: "Ticket submitted successfully!" });
        setSubject("");
        setMessage("");
        setSubmitted(true);
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
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HugeiconsIcon icon={HelpCircleIcon} size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-sm text-muted-foreground">
            Get answers to your questions and contact our support team
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <FAQAccordion items={faqs} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <HugeiconsIcon icon={EmailIcon} size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">support@cheapship.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <HugeiconsIcon icon={CallIcon} size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">+91-XXXXXXXXXX</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <HugeiconsIcon icon={Clock01Icon} size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Working Hours</p>
                  <p className="text-sm font-medium">Mon - Sat, 9 AM - 6 PM IST</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raise a Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={24}
                    className="text-green-600 dark:text-green-400"
                  />
                </div>
                <h3 className="font-semibold">Ticket Submitted!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll get back to you within 24 hours
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSubmitted(false)}
                >
                  Submit Another Ticket
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
                    placeholder="Describe your issue..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
