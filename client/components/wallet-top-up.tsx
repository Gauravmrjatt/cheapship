"use client";

import { useState, useEffect } from "react";
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";
import { useCreateRazorpayOrder, useVerifyRazorpayPayment } from "@/lib/hooks/use-transactions";
import { useUser } from "@/lib/hooks/use-user";
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
import { Alert02Icon } from "@hugeicons/core-free-icons";

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
  const { Razorpay, error: razorpayLoadError } = useRazorpay();
  const createOrderMutation = useCreateRazorpayOrder();
  const verifyPaymentMutation = useVerifyRazorpayPayment();

  // Handle errors from useRazorpay directly
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

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetState();
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet to pay for shipping charges.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount (e.g. 500)"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="h-12 text-lg font-bold"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[500, 1000, 2000].map(amt => (
              <Button
                key={amt}
                variant="outline"
                className="h-10 text-xs font-bold"
                onClick={() => setTopUpAmount(amt.toString())}
              >
                ₹{amt}
              </Button>
            ))}
          </div>
        </div>
        {displayError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <HugeiconsIcon icon={Alert02Icon} size={16} />
            <span>{displayError}</span>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={handleTopUp}
            disabled={state.isProcessing || !topUpAmount || parseFloat(topUpAmount) <= 0}
          >
            {state.isProcessing && !createOrderMutation.isPending ? "Processing..." : "Pay Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
