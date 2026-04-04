"use client";

import { useState, useEffect, useMemo } from "react";
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";
import { useCreateRazorpayOrder, useVerifyRazorpayPayment } from "@/lib/hooks/use-transactions";
import { useUser } from "@/lib/hooks/use-user";
import { useActiveWalletPlans, WalletPlan } from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, GiftIcon, WalletIcon, SparklesIcon, MoneySendFlowIcon, ArrowRight01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface WalletTopUpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: 'WALLET_TOPUP';
  initialAmount?: string;
}

export function WalletTopUp({ open, onOpenChange, category = 'WALLET_TOPUP', initialAmount = "" }: WalletTopUpProps) {
  const [topUpAmount, setTopUpAmount] = useState(initialAmount);

  useEffect(() => {
    if (initialAmount) {
      setTopUpAmount(initialAmount);
    }
  }, [initialAmount]);

  const [state, setState] = useState({
    error: null as string | null,
    isProcessing: false,
  });

  const { data: user } = useUser();
  const { data: plansData, isLoading: plansLoading } = useActiveWalletPlans();
  const { Razorpay, error: razorpayLoadError } = useRazorpay();
  const createOrderMutation = useCreateRazorpayOrder();
  const verifyPaymentMutation = useVerifyRazorpayPayment();

  const plans: WalletPlan[] = plansData?.data || [];

  const applicablePlan = useMemo(() => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0 || plans.length === 0) return null;
    
    const sortedPlans = [...plans].sort((a, b) => b.recharge_amount - a.recharge_amount);
    return sortedPlans.find(plan => amount >= plan.recharge_amount) || null;
  }, [topUpAmount, plans]);

  const bonusAmount = useMemo(() => {
    if (!applicablePlan) return 0;
    return (parseFloat(topUpAmount) * applicablePlan.discount_percentage) / 100;
  }, [topUpAmount, applicablePlan]);

  const finalAmount = useMemo(() => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount)) return 0;
    return amount + bonusAmount;
  }, [topUpAmount, bonusAmount]);

  const displayError = state.error || (razorpayLoadError ? "Failed to load payment gateway. Please check your internet connection." : null);

  const resetState = () => {
    setTopUpAmount(initialAmount);
    setState({ error: null, isProcessing: false });
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (!Razorpay) {
      setState(prev => ({ ...prev, error: "Payment gateway not available. Please refresh and try again." }));
      return;
    }

    setState({ error: null, isProcessing: true });

    try {
      const order = await createOrderMutation.mutateAsync({ amount });

      const options: RazorpayOrderOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: order.amount,
        currency: order.currency as "INR",
        name: "Cheap Ship",
        description: "Wallet Top-up",
        order_id: order.id,
        handler: (response) => {
          verifyPaymentMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: amount,
            category: category
          });
          onOpenChange(false);
          resetState();
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.mobile,
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: () => {
            setState(prev => ({ ...prev, isProcessing: false }));
          }
        }
      };

      const rzp1 = new Razorpay(options);
      rzp1.on('payment.failed', (response: any) => {
        setState({
          error: response.error.description || "Payment failed. Please try again.",
          isProcessing: false
        });
      });
      rzp1.open();
    } catch (error) {
      console.error("Payment initiation failed", error);
      setState({
        error: "Failed to initiate payment. Please try again.",
        isProcessing: false
      });
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetState();
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        {/* Ticket Header */}
        <div className="relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 px-6 py-5 text-primary-foreground">
          {/* Ticket perforation pattern */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-background/10">
            <div className="absolute -bottom-2 left-8 w-4 h-4 bg-background rounded-full" />
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-background rounded-full" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <HugeiconsIcon icon={WalletIcon} className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Top Up Wallet</DialogTitle>
              <DialogDescription className="text-white/80 text-sm">
                Add funds to pay for shipping charges
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-5">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Enter Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₹</span>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="h-16 text-3xl font-bold pl-10 border-2 focus:border-primary"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map(amt => (
              <Button
                key={amt}
                variant={topUpAmount === amt.toString() ? "default" : "outline"}
                className={cn(
                  "h-11 font-semibold transition-all",
                  topUpAmount === amt.toString() && "ring-2 ring-primary/20 ring-offset-2"
                )}
                onClick={() => setTopUpAmount(amt.toString())}
              >
                ₹{amt.toLocaleString()}
              </Button>
            ))}
          </div>

          <Separator />

          {/* Bonus Section */}
          {applicablePlan && bonusAmount > 0 ? (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                      <HugeiconsIcon icon={SparklesIcon} className="size-4 text-white" />
                    </div>
                    <span className="font-semibold text-green-700">
                      {applicablePlan.discount_percentage}% Bonus Applied!
                    </span>
                  </div>
                  <Badge className="bg-green-500 text-white hover:bg-green-600">
                    {applicablePlan.name}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600 mb-1">You Pay</p>
                    <p className="text-lg font-bold text-green-700">
                      ₹{parseFloat(topUpAmount).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600 mb-1">Bonus</p>
                    <p className="text-lg font-bold text-green-700">
                      +₹{bonusAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <span className="text-sm font-medium text-green-700">Final Wallet Credit</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{finalAmount.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <HugeiconsIcon icon={GiftIcon} className="size-5 text-muted-foreground" />
                  <span className="font-medium">Available Offers</span>
                </div>
                {plansLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-8 flex-1 bg-muted animate-pulse rounded-md" />
                    ))}
                  </div>
                ) : plans.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {plans.map(plan => (
                      <div
                        key={plan.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-background rounded-full border text-sm"
                      >
                        <span className="font-medium">₹{plan.recharge_amount.toLocaleString()}+</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 text-muted-foreground" />
                        <span className="text-green-600 font-bold">+{plan.discount_percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No offers available</p>
                )}
                {plans.length > 0 && !applicablePlan && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Recharge higher to unlock bonus cash!
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {displayError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <HugeiconsIcon icon={Alert02Icon} size={16} />
              <span>{displayError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            className="w-full h-12 text-lg font-semibold"
            onClick={handleTopUp}
            disabled={state.isProcessing || !topUpAmount || parseFloat(topUpAmount) <= 0}
          >
            {state.isProcessing ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={MoneySendFlowIcon} className="mr-2 size-5" />
                Pay ₹{parseFloat(topUpAmount || "0").toLocaleString()}
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Secure payment via Razorpay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}