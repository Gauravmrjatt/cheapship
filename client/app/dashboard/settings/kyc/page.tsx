"use client";

import { useState, useEffect } from "react";
import { useHttp } from "@/lib/hooks/use-http";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Shield01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  UserSquareIcon,
  Building06Icon
} from "@hugeicons/core-free-icons";
import { sileo } from "sileo";
import { Skeleton } from "@/components/ui/skeleton";

interface KycData {
  pan_number: string | null;
  pan_verified: boolean;
  aadhaar_number: string | null;
  aadhaar_verified: boolean;
  gst_number: string | null;
  gst_verified: boolean;
  kyc_status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
}

export default function KycPage() {
  const http = useHttp();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    pan_number: "",
    aadhaar_number: "",
    gst_number: ""
  });

  const { data: kycData, isLoading } = useQuery<KycData>(
    http.get(["kyc-status"], "/auth/kyc")
  );

  useEffect(() => {
    if (kycData) {
      setFormData({
        pan_number: kycData.pan_number || "",
        aadhaar_number: kycData.aadhaar_number || "",
        gst_number: kycData.gst_number || ""
      });
    }
  }, [kycData]);

  const { mutate: updateKyc, isPending: isUpdating } = useMutation(
    http.put("/auth/kyc", {
      onSuccess: () => {
        sileo.success({ title: "KYC details updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
      }
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: Record<string, string> = {};

    if (formData.pan_number) dataToSubmit.pan_number = formData.pan_number.toUpperCase();
    if (formData.aadhaar_number) dataToSubmit.aadhaar_number = formData.aadhaar_number;
    if (formData.gst_number) dataToSubmit.gst_number = formData.gst_number.toUpperCase();

    updateKyc(dataToSubmit as any);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Verified</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Submitted</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20">Pending</Badge>;
    }
  };

  const getFieldStatus = (value: string | null, verified: boolean) => {
    if (!value) return null;
    if (verified) {
      return (
        <div className="flex items-center gap-1 text-green-600 text-xs">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
          Verified
        </div>
      );
    }
    return <span className="text-xs text-yellow-600">Pending verification</span>;
  };

  if (isLoading) {
    return (
      <div className="py-10 px-4 space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 space-y-6 max-w-2xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">
            Complete your KYC to unlock all features and higher transaction limits.
          </p>
        </div>
        {kycData && getStatusBadge(kycData.kyc_status)}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={UserSquareIcon} size={18} className="text-primary" />
              <CardTitle className="text-lg">Personal Details</CardTitle>
            </div>
            <CardDescription>
              PAN is required for business users. Aadhaar is optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pan_number">PAN Number</Label>
                {kycData && getFieldStatus(kycData.pan_number, kycData.pan_verified)}
              </div>
              <Input
                id="pan_number"
                placeholder="ABCDE1234F"
                maxLength={10}
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">10 character alphanumeric (e.g., ABCDE1234F)</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="aadhaar_number">Aadhaar Number (Optional)</Label>
                {kycData && getFieldStatus(kycData.aadhaar_number, kycData.aadhaar_verified)}
              </div>
              <Input
                id="aadhaar_number"
                placeholder="123456789012"
                maxLength={12}
                value={formData.aadhaar_number}
                onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/\D/g, "") })}
              />
              <p className="text-xs text-muted-foreground">12 digit number without spaces</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Building06Icon} size={18} className="text-primary" />
              <CardTitle className="text-lg">Business Details (Optional)</CardTitle>
            </div>
            <CardDescription>
              Add your GST number for business verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gst_number">GST Number</Label>
                {kycData && getFieldStatus(kycData.gst_number, kycData.gst_verified)}
              </div>
              <Input
                id="gst_number"
                placeholder="12ABCDE3456F7Z8"
                maxLength={15}
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">15 character GSTIN (e.g., 12ABCDE3456F7Z8)</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (kycData) {
                setFormData({
                  pan_number: kycData.pan_number || "",
                  aadhaar_number: kycData.aadhaar_number || "",
                  gst_number: kycData.gst_number || ""
                });
              }
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={16} />
                Saving...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Shield01Icon} size={16} />
                Save KYC Details
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
