"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useHttp } from "@/lib/hooks/use-http";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Comment01Icon,
    Message01Icon,
    AlertCircleIcon,
    CheckmarkCircle01Icon,
    Loading03Icon
} from "@hugeicons/core-free-icons";

const feedbackSchema = z.object({
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(20, "Message must be at least 20 characters"),
    type: z.enum(["FEEDBACK", "COMPLAINT"]),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
    const http = useHttp();
    const [success, setSuccess] = useState(false);

    const { mutate, isPending } = useMutation(
        http.post("/feedback", {
            onSuccess: () => {
                setSuccess(true);
                sileo.success({
                    title: "Feedback Submitted",
                    description: "Thank you for your feedback! We will review it shortly.",
                });
                form.reset();
            },
            onError: (error: any) => {
                sileo.error({
                    title: "Submission Failed",
                    description: error.message || "Failed to submit feedback. Please try again.",
                });
            },
        })
    );

    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            subject: "",
            message: "",
            type: "FEEDBACK",
        },
    });

    const onSubmit = (values: FeedbackFormValues) => {
        mutate(values as any);
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center border-4 border-green-200">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Feedback Received</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Your message has been sent to our team. We appreciate your input and will get back to you if required.
                    </p>
                </div>
                <Button onClick={() => setSuccess(false)} variant="outline">
                    Submit Another
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Feedback & Complaints</h1>
                <p className="text-muted-foreground">
                    Help us improve Cashbackwallah. Share your thoughts, report issues, or suggest new features.
                </p>
            </div>

            <Card className="shadow-lg border-2 border-primary/5 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <HugeiconsIcon icon={Comment01Icon} className="text-primary" size={20} />
                        Write to Us
                    </CardTitle>
                    <CardDescription>We value every piece of feedback we receive.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Request Type</Label>
                                <Select
                                    onValueChange={(value) => form.setValue("type", value as any)}
                                    defaultValue={form.getValues("type")}
                                >
                                    <SelectTrigger id="type" className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FEEDBACK">General Feedback</SelectItem>
                                        <SelectItem value="COMPLAINT">Serious Complaint</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="subject">Subject</Label>
                                <div className="relative">
                                    <HugeiconsIcon icon={Message01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                                    <Input
                                        id="subject"
                                        placeholder="Briefly describe your feedback"
                                        className="pl-10"
                                        {...form.register("subject")}
                                    />
                                </div>
                                {form.formState.errors.subject && (
                                    <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                                        <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                                        {form.formState.errors.subject.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="message">Detailed Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Tell us more about your experience or the issue you're facing..."
                                    className="min-h-[150px] resize-none"
                                    {...form.register("message")}
                                />
                                {form.formState.errors.message && (
                                    <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                                        <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                                        {form.formState.errors.message.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-base font-bold gap-2" disabled={isPending}>
                            {isPending ? (
                                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={20} />
                            ) : (
                                <HugeiconsIcon icon={Comment01Icon} size={20} />
                            )}
                            {isPending ? "Sending..." : "Submit Feedback"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                    <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
                </div>
                <div className="space-y-1">
                    <h4 className="font-bold text-sm">Need immediate assistance?</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        For urgent issues regarding active shipments or payments, please visit our <Button variant="link" className="p-0 h-auto text-xs font-bold" onClick={() => (window.location.href = '/dashboard/help')}>Help Center</Button> or contact support directly.
                    </p>
                  {/*<Button 
                        variant="outline" 
                        className="mt-3 text-xs"
                        onClick={() => window.open('mailto:admin@cheapship.com?subject=Cashbackwallah Feedback/Complaint', '_blank')}
                    >
                        Email Admin
                    </Button> */}  
                </div>
            </div>
        </div>
    );
}
