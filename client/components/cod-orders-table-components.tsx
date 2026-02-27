"use client"

import * as React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Loading03Icon,
  MoneyReceiveCircleIcon,
} from "@hugeicons/core-free-icons"
import { CODOrder } from "./cod-orders-data-table"

const formatCurrency = (amount: number | null) => {
  if (!amount) return "-"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

interface RemittanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedOrder: CODOrder | null
  remittanceForm: {
    remittance_status: string
    payout_status: string
    remitted_amount: string
    remittance_ref_id: string
  }
  setRemittanceForm: React.Dispatch<React.SetStateAction<{
    remittance_status: string
    payout_status: string
    remitted_amount: string
    remittance_ref_id: string
  }>>
  onUpdate: () => void
  isUpdating?: boolean
}

export function RemittanceDialog({
  open,
  onOpenChange,
  selectedOrder,
  remittanceForm,
  setRemittanceForm,
  onUpdate,
  isUpdating,
}: RemittanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={MoneyReceiveCircleIcon} size={20} />
            Update Remittance Status
          </DialogTitle>
          <DialogDescription>
            Order #{selectedOrder?.id?.slice(0, 8)} - COD Amount: {formatCurrency(selectedOrder?.cod_amount || 0)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Remittance Status (From Shiprocket)</Label>
            <Select
              value={remittanceForm.remittance_status}
              onValueChange={(v) => { if (v) setRemittanceForm(prev => ({ ...prev, remittance_status: v })) }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="REMITTED">Remitted</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payout Status (To User)</Label>
            <Select
              value={remittanceForm.payout_status}
              onValueChange={(v) => { if (v) setRemittanceForm(prev => ({ ...prev, payout_status: v })) }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {remittanceForm.payout_status === "PENDING" && selectedOrder?.user?.upi_id && (
            <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center gap-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pay via UPI App</p>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${selectedOrder.user.upi_id}&am=${selectedOrder.cod_amount}`}
                alt="UPI QR Code"
                width={150}
                height={150}
                className="rounded-md shadow-sm bg-white p-2 object-contain mix-blend-multiply"
              />
              <p className="text-xs font-medium text-center">{selectedOrder.user.upi_id}</p>
              <p className="text-[10px] text-muted-foreground text-center">Scan to pay exactly {formatCurrency(selectedOrder.cod_amount)}</p>
            </div>
          )}

          {remittanceForm.remittance_status === "REMITTED" && (
            <>
              <div className="space-y-2">
                <Label>Remitted Amount</Label>
                <Input
                  type="number"
                  value={remittanceForm.remitted_amount}
                  onChange={(e) => setRemittanceForm(prev => ({ ...prev, remitted_amount: e.target.value }))}
                  placeholder="Enter remitted amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Reference ID (Optional)</Label>
                <Input
                  value={remittanceForm.remittance_ref_id}
                  onChange={(e) => setRemittanceForm(prev => ({ ...prev, remittance_ref_id: e.target.value }))}
                  placeholder="Transaction reference ID"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" size={16} />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CODStatsCardsProps {
  summary?: {
    totalPendingCOD: number
    totalRemitted: number
  }
  totalOrders?: number
  isLoading?: boolean
}

export function CODStatsCards({ summary, totalOrders, isLoading }: CODStatsCardsProps) {
  if (!summary) return null

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium text-muted-foreground">Pending Remittance</p>
        {isLoading ? (
          <div className="h-7 w-32 bg-muted animate-pulse rounded mt-1" />
        ) : (
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPendingCOD)}</p>
        )}
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium text-muted-foreground">Total Remitted</p>
        {isLoading ? (
          <div className="h-7 w-32 bg-muted animate-pulse rounded mt-1" />
        ) : (
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRemitted)}</p>
        )}
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium text-muted-foreground">Total COD Orders</p>
        {isLoading ? (
          <div className="h-7 w-20 bg-muted animate-pulse rounded mt-1" />
        ) : (
          <p className="text-2xl font-bold">{totalOrders || 0}</p>
        )}
      </div>
    </div>
  )
}
