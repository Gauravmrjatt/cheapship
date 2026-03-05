"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { AdminKycUser, useUpdateKycStatus } from "@/lib/hooks/use-admin"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Props {
  user: AdminKycUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KycDetailsSheet({ user, open, onOpenChange }: Props) {
  const updateKycMutation = useUpdateKycStatus()

  const [kycStatus, setKycStatus] = React.useState("")
  const [panVerified, setPanVerified] = React.useState(false)
  const [aadhaarVerified, setAadhaarVerified] = React.useState(false)
  const [gstVerified, setGstVerified] = React.useState(false)

  React.useEffect(() => {
    if (!user) return
    setKycStatus(user.kyc_status)
    setPanVerified(user.pan_verified)
    setAadhaarVerified(user.aadhaar_verified)
    setGstVerified(user.gst_verified)
  }, [user])

  if (!user) return null

  const handleSave = () => {
    updateKycMutation.mutate(
      {
        userId: user.id,
        kyc_status: kycStatus,
        pan_verified: panVerified,
        aadhaar_verified: aadhaarVerified,
        gst_verified: gstVerified,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col min-w-full  md:min-w-[600px] p-0">

        {/* HEADER */}
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle>KYC Verification</SheetTitle>
          <SheetDescription>
            Review documents and approve verification for{" "}
            <span className="font-medium">{user.name}</span>
          </SheetDescription>
        </SheetHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto space-y-5 px-6 py-6">

          {/* USER INFO */}
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm font-medium">User Information</p>
            </CardHeader>

            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Name" value={user.name} />
              <Info label="Email" value={user.email} />
              <Info label="Mobile" value={user.mobile} />
            </CardContent>
          </Card>

          {/* DOCUMENTS */}
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm font-medium">Document Verification</p>
            </CardHeader>

            <CardContent className="space-y-3">
              <DocRow
                label="PAN Number"
                value={user.pan_number}
                checked={panVerified}
                onChange={setPanVerified}
              />

              <DocRow
                label="Aadhaar Number"
                value={user.aadhaar_number}
                checked={aadhaarVerified}
                onChange={setAadhaarVerified}
              />

              <DocRow
                label="GST Number"
                value={user.gst_number}
                checked={gstVerified}
                onChange={setGstVerified}
              />
            </CardContent>
          </Card>

          {/* FINAL STATUS */}
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm font-medium">Final Decision</p>
            </CardHeader>

            <CardContent className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Overall KYC Status
              </Label>

              <Select value={kycStatus} onValueChange={(v) => v && setKycStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* FOOTER (STICKY) */}
        <div className="border-t px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={updateKycMutation.isPending}
          >
            {updateKycMutation.isPending
              ? "Updating..."
              : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ----------------- SMALL COMPONENTS ----------------- */

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  )
}

function DocRow({
  label,
  value,
  checked,
  onChange,
}: {
  label: string
  value: string | null | undefined
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const available = Boolean(value)

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>

        <p
          className={cn(
            "font-mono tracking-widest text-sm",
            !available && "text-muted-foreground"
          )}
        >
          {value || "Not provided"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={checked ? "default" : "secondary"}>
          {checked ? "Verified" : "Pending"}
        </Badge>

        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onChange(!!v)}
          disabled={!available}
        />
      </div>
    </div>
  )
}