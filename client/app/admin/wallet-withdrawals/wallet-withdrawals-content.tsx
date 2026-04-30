"use client";

import { useState } from "react";
import Image from "next/image";
import { useAdminWalletWithdrawals, useProcessWalletWithdrawal, AdminWalletWithdrawal } from "@/lib/hooks/use-wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Loading03Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Time04Icon,
  RefreshIcon
} from "@hugeicons/core-free-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function WalletWithdrawalsContent() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWalletWithdrawal | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processStatus, setProcessStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [referenceId, setReferenceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const { data, isLoading, refetch } = useAdminWalletWithdrawals(statusFilter, page, 20);
  const processMutation = useProcessWalletWithdrawal();

  const handleProcess = () => {
    if (!selectedWithdrawal) return;
    
    processMutation.mutate(
      {
        id: selectedWithdrawal.id,
        status: processStatus,
        reference_id: referenceId || undefined,
        payment_method: paymentMethod || undefined,
        admin_note: adminNote || undefined
      },
      {
        onSuccess: () => {
          setShowProcessDialog(false);
          setSelectedWithdrawal(null);
          setReferenceId("");
          setPaymentMethod("");
          setAdminNote("");
          refetch();
        }
      }
    );
  };

  const openProcessDialog = (withdrawal: AdminWalletWithdrawal, status: "APPROVED" | "REJECTED") => {
    setSelectedWithdrawal(withdrawal);
    setProcessStatus(status);
    setShowProcessDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50"><HugeiconsIcon icon={Time04Icon} className="mr-1 size-3" />Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50"><HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-1 size-3" />Approved</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50"><HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-1 size-3" />Completed</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50"><HugeiconsIcon icon={Cancel01Icon} className="mr-1 size-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 py-9">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wallet Withdrawals</h1>
            <p className="text-muted-foreground">Manage user wallet withdrawal requests</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <HugeiconsIcon icon={RefreshIcon} className="size-4" />
          </Button>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="APPROVED">Approved</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <div className="space-y-2">
            {data.data.map((withdrawal: AdminWalletWithdrawal) => (
              <Card key={withdrawal.id} className="rounded-xl border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-lg">₹{Number(withdrawal.amount).toLocaleString("en-IN")}</p>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{withdrawal.user?.name}</span>
                        <span>{withdrawal.user?.email}</span>
                        <span>{withdrawal.user?.mobile}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Requested: {new Date(withdrawal.created_at).toLocaleString("en-IN")}
                        {withdrawal.reference_id && <span className="ml-2">| Ref: {withdrawal.reference_id}</span>}
                        {withdrawal.payment_method && <span className="ml-2">| Method: {withdrawal.payment_method}</span>}
                      </div>
                      {withdrawal.admin_note && (
                        <p className="text-xs text-muted-foreground mt-1">Admin note: {withdrawal.admin_note}</p>
                      )}
                      {withdrawal.status === "PENDING" && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openProcessDialog(withdrawal, "APPROVED")}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-1 size-4" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => openProcessDialog(withdrawal, "REJECTED")}
                          >
                            <HugeiconsIcon icon={Cancel01Icon} className="mr-1 size-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Wallet Balance</p>
                      <p className="font-medium">₹{Number(withdrawal.user?.wallet_balance || 0).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground mt-1">Bank: {withdrawal.user?.bank_name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">UPI: {withdrawal.user?.upi_id || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {data.pagination.currentPage} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card className="rounded-xl border-none shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No withdrawal requests found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Process Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processStatus === "APPROVED" ? "Approve Withdrawal" : "Reject Withdrawal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-semibold">₹{selectedWithdrawal && Number(selectedWithdrawal.amount).toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground mt-1">User: {selectedWithdrawal?.user?.name}</p>
            </div>

            {processStatus === "APPROVED" && (
              <>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK">Bank Transfer</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {processStatus === "APPROVED" && paymentMethod === "UPI" && selectedWithdrawal?.user?.upi_id && (
                  <Tabs defaultValue="UPI" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="UPI" className="flex-1">UPI</TabsTrigger>
                    </TabsList>
                    <TabsContent value="UPI" className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg flex flex-col items-center justify-center gap-2">
                        <Image 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${selectedWithdrawal?.user?.upi_id}&am=${Number(selectedWithdrawal?.amount || 0)}`)}`}
                          alt="UPI QR Code" 
                          width={120} 
                          height={120} 
                          className="rounded-md shadow-sm bg-white p-2"
                        />
                        <p className="text-xs font-medium text-center">{selectedWithdrawal?.user?.upi_id}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Amount: ₹{Number(selectedWithdrawal?.amount || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {processStatus === "APPROVED" && paymentMethod === "BANK" && selectedWithdrawal?.user?.bank_name && (
                  <Tabs defaultValue="BANK" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="BANK" className="flex-1">Bank Transfer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="BANK" className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bank:</span>
                          <span className="font-medium">{selectedWithdrawal?.user?.bank_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Beneficiary:</span>
                          <span className="font-medium">{selectedWithdrawal?.user?.beneficiary_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account:</span>
                          <span className="font-medium">{selectedWithdrawal?.user?.account_number || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IFSC:</span>
                          <span className="font-medium">{selectedWithdrawal?.user?.ifsc_code || "N/A"}</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                <div className="space-y-2">
                  <Label>Reference / Transaction ID</Label>
                  <Input 
                    value={referenceId} 
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="Enter transaction reference"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Admin Note (Optional)</Label>
              <Input 
                value={adminNote} 
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcess}
              disabled={processMutation.isPending}
              className={processStatus === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processMutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
                  Processing...
                </>
              ) : processStatus === "APPROVED" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}