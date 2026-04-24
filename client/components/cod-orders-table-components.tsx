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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
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

const getPercentage = (value: number, total: number): number =>
  total ? Number(((value / 100) * total).toFixed(2)) : 0;

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
  const totalCOD = selectedOrder?.cod_amount || 0;
  const commission = getPercentage(2, totalCOD);
  const amountToPay = totalCOD - commission;
  const upiString = `upi://pay?pa=${selectedOrder?.user?.upi_id}&am=${amountToPay}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={MoneyReceiveCircleIcon} size={20} />
            Update Remittance Status
          </DialogTitle>
          <DialogDescription>
            Order #{selectedOrder?.id?.slice(0, 8)} - COD Amount: {formatCurrency(totalCOD)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex justify-between text-sm">
              <span>Total COD Amount:</span>
              <span className="font-medium">{formatCurrency(totalCOD)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Admin Commission (2%):</span>
              <span className="font-medium">-{formatCurrency(commission)}</span>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
              <span>User Will Receive:</span>
              <span className="text-green-600">{formatCurrency(amountToPay)}</span>
            </div>
          </div>

          {(selectedOrder?.user?.upi_id || selectedOrder?.user?.bank_name) && (
            <div className="space-y-2">
              <Label>Payment Details</Label>
              <Tabs defaultValue={selectedOrder?.user?.upi_id ? "UPI" : "BANK"} className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  {selectedOrder?.user?.upi_id && <TabsTrigger value="UPI">UPI</TabsTrigger>}
                  {selectedOrder?.user?.bank_name && <TabsTrigger value="BANK">Bank Transfer</TabsTrigger>}
                </TabsList>
                {selectedOrder?.user?.upi_id && (
                  <TabsContent value="UPI">
                    <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center gap-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pay via UPI</p>
                      <Image
                        src={qrUrl}
                        alt="UPI QR Code"
                        width={120}
                        height={120}
                        className="rounded-md shadow-sm bg-white p-2 object-contain mix-blend-multiply"
                      />
                      <p className="text-xs font-medium text-center">{selectedOrder.user.upi_id}</p>
                      <p className="text-[10px] text-muted-foreground text-center">Scan to pay exactly {formatCurrency(amountToPay)}</p>
                    </div>
                  </TabsContent>
                )}
                {selectedOrder?.user?.bank_name && (
                  <TabsContent value="BANK">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="font-medium">{selectedOrder.user.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Beneficiary:</span>
                        <span className="font-medium">{selectedOrder.user.beneficiary_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account:</span>
                        <span className="font-medium">XXXX{selectedOrder.user.account_number?.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IFSC:</span>
                        <span className="font-medium">{selectedOrder.user.ifsc_code}</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                        <span>Amount to Transfer:</span>
                        <span className="text-green-600">{formatCurrency(amountToPay)}</span>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}

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
            <div className="p-4 bg-white rounded-lg flex flex-col items-center justify-center gap-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pay via UPI App</p>
              <Image
                src={`${qrUrl}`}
                alt="UPI QR Code"
                width={150}
                height={150}
                className="rounded-md shadow-sm bg-white p-2 object-contain mix-blend-multiply"
              />
              <p className="text-xs font-medium text-black text-center">{selectedOrder.user.upi_id}</p>
              <p className="text-[10px] text-muted-foreground text-center">Scan to pay ₹{Math.round(amountToPay)} (after 2% commission)</p>
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
