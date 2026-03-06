"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  WeightScale01Icon, 
  ImageAdd01Icon, 
  Alert01Icon, 
  CheckmarkCircle02Icon,
  Loading03Icon,
  Search01Icon,
  ArrowRight01Icon,
  Clock01Icon
} from "@hugeicons/core-free-icons";
import { useWeightDisputes, useRaiseWeightDispute, WeightDispute } from "@/lib/hooks/use-dispute";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const disputeSchema = z.object({
  awb_number: z.string().min(1, "AWB number is required"),
  declared_weight: z.number().min(0.01, "Declared weight must be greater than 0"),
  charged_weight: z.number().min(0.01, "Charged weight must be greater than 0"),
  product_category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type DisputeFormValues = z.infer<typeof disputeSchema>;

const productCategories = [
  "Electronics",
  "Apparel & Fashion",
  "Home & Kitchen",
  "Beauty & Personal Care",
  "Books & Stationery",
  "Toys & Games",
  "Automotive",
  "Others"
];

export default function WeightMismatchContent() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [weightPhoto, setWeightPhoto] = useState<File | null>(null);
  const [packedPhoto, setPackedPhoto] = useState<File | null>(null);
  
  const { data: disputesData, isLoading: isLoadingDisputes } = useWeightDisputes(page, 10, statusFilter);
  const raiseDisputeMutation = useRaiseWeightDispute();

  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      awb_number: "",
      declared_weight: 0,
      charged_weight: 0,
      product_category: "",
      description: "",
    }
  });

  const onSubmit = (values: DisputeFormValues) => {
    // In a real app, we would upload files first and get URLs
    // For now, we pass the form values. 
    // We can simulate the upload by just adding placeholders for images if they are selected.
    const submissionData = {
      ...values,
      weight_scale_image: weightPhoto ? "uploaded_weight_photo_url" : undefined,
      packed_box_image: packedPhoto ? "uploaded_packed_photo_url" : undefined,
    };

    raiseDisputeMutation.mutate(submissionData, {
      onSuccess: () => {
        form.reset();
        setWeightPhoto(null);
        setPackedPhoto(null);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'weight' | 'packed') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'weight') setWeightPhoto(e.target.files[0]);
      else setPackedPhoto(e.target.files[0]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge className="bg-green-500 hover:bg-green-600">Accepted</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
          Weight Dispute
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Raise a dispute if you believe you have been incorrectly charged for shipment weight.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
  
        {/* Disputes History */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent Disputes</CardTitle>
                <CardDescription>Track status of your submitted weight disputes.</CardDescription>
              </div>
              <Select onValueChange={(val) => val && setStatusFilter(val)} value={statusFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="pl-6">Order Details</TableHead>
                    <TableHead>Weight (App/Chg)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingDisputes ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4} className="h-16 animate-pulse bg-muted/20" />
                      </TableRow>
                    ))
                  ) : !disputesData?.data?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <HugeiconsIcon icon={Search01Icon} size={32} className="opacity-20" />
                          <p>No disputes found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    disputesData.data.map((dispute: WeightDispute) => (
                      <TableRow key={dispute.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">#{dispute.order?.id.toString().slice(-8)}</span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{dispute.order?.tracking_number}</span>
                            <span className="text-[10px] text-primary font-bold mt-0.5">{dispute.order?.courier_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{dispute.applied_weight}kg</span>
                            <HugeiconsIcon icon={ArrowRight01Icon} size={10} className="text-muted-foreground" />
                            <span className="text-xs font-bold text-destructive">{dispute.charged_weight}kg</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(dispute.status)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-medium">{format(new Date(dispute.created_at), "dd MMM yyyy")}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(dispute.created_at), "HH:mm")}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/10 shadow-none rounded-2xl">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="bg-background p-3 rounded-xl shadow-sm h-fit">
                  <HugeiconsIcon icon={Alert01Icon} className="text-amber-500" size={24} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">Dispute Resolution Process</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Once submitted, your dispute request will be forwarded to Shiprocket weight experts for review. 
                    Resolution typically takes <span className="font-bold text-foreground">5–7 working days</span>. 
                    If accepted, the excess charge will be refunded to your wallet.
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="text-green-500" size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Upload scale photos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="text-green-500" size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Upload packed box photos</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
