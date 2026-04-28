"use client";

import { useState } from "react";
import { useWalletBalance, useWalletWithdrawals, useRequestWithdrawal, WalletWithdrawal } from "@/lib/hooks/use-wallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Wallet01Icon, 
  ArrowDownLeftIcon,
  Loading03Icon,
  InformationCircleIcon,
  Calendar02Icon,
  BankIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Time04Icon
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";

export default function WalletWithdrawalPage() {
  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance();
  const { data: withdrawals, isLoading: withdrawalsLoading, refetch } = useWalletWithdrawals();
  const requestMutation = useRequestWithdrawal();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawalAmount = parseFloat(amount);
    if (!withdrawalAmount || withdrawalAmount <= 0) return;
    if (balanceData && withdrawalAmount > Number(balanceData.wallet_balance)) return;

    requestMutation.mutate(
      { amount: withdrawalAmount, note: note || undefined },
      {
        onSuccess: () => {
          setAmount("");
          setNote("");
          refetch();
        }
      }
    );
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
    <div className="flex flex-1 flex-col md:px-6 px-2">
      <div className="flex flex-col gap-6 py-9">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallet Withdrawal</h1>
          <p className="text-muted-foreground">Request withdrawal of your wallet balance</p>
        </div>

        {/* Balance Card */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <HugeiconsIcon icon={Wallet01Icon} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="h-8 w-24 animate-pulse bg-muted rounded" />
              ) : (
                <>
                  <div className="text-3xl font-bold">₹{Number(balanceData?.wallet_balance || 0).toLocaleString("en-IN")}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {balanceData?.has_bank_details ? "Bank details configured" : "No bank details - contact support"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Withdrawal Eligibility</CardTitle>
              <HugeiconsIcon icon={InformationCircleIcon} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="h-8 w-24 animate-pulse bg-muted rounded" />
              ) : balanceData?.is_withdrawable ? (
                <div className="flex items-center text-green-600">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-2 h-5 w-5" />
                  <span className="font-medium">Eligible to withdraw</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center text-red-600">
                    <HugeiconsIcon icon={Cancel01Icon} className="mr-2 h-5 w-5" />
                    <span className="font-medium">Not eligible</span>
                  </div>
                  {balanceData?.last_order_date && (
                    <p className="text-xs text-muted-foreground">
                      <HugeiconsIcon icon={Calendar02Icon} className="inline mr-1 size-3" />
                      Last order: {new Date(balanceData.last_order_date).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bank Details</CardTitle>
              <HugeiconsIcon icon={BankIcon} className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                  <div className="h-4 w-24 animate-pulse bg-muted rounded" />
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{balanceData?.bank_name || "Not set"}</p>
                  <p className="text-xs text-muted-foreground">
                    {balanceData?.upi_id ? `UPI: ${balanceData.upi_id}` : balanceData?.account_number ? `A/c: ${balanceData.account_number}` : "No details"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Form */}
        {balanceData?.is_withdrawable && (
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={ArrowDownLeftIcon} className="size-5" />
                Request Withdrawal
              </CardTitle>
              <CardDescription>
                Enter the amount you want to withdraw. The amount will be debited from your wallet instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={Number(balanceData.wallet_balance)}
                    min={1}
                    className="font-bold text-lg h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: ₹{Number(balanceData.wallet_balance).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Input
                    id="note"
                    type="text"
                    placeholder="Any special instructions"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 font-bold"
                  disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > Number(balanceData.wallet_balance) || requestMutation.isPending}
                >
                  {requestMutation.isPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Withdraw ₹${amount || "0"}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Withdrawal History */}
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawalsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
                ))}
              </div>
            ) : withdrawals && withdrawals.length > 0 ? (
              <div className="space-y-2">
                {withdrawals.map((withdrawal: WalletWithdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">₹{Number(withdrawal.amount).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(withdrawal.created_at).toLocaleString("en-IN")}
                      </p>
                      {withdrawal.note && (
                        <p className="text-xs text-muted-foreground">{withdrawal.note}</p>
                      )}
                    </div>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No withdrawal requests yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}