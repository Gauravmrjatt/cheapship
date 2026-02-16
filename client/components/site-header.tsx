import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { RupeeSquareIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useTopUpWallet, useCreateRazorpayOrder, useVerifyRazorpayPayment } from "@/lib/hooks/use-transactions";
import { useState } from "react";
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";


import {
  Loading03Icon,
} from "@hugeicons/core-free-icons";
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

interface SiteHeaderProps {
  pageTitle: string;
}

export function SiteHeader({ pageTitle }: SiteHeaderProps) {
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");

  const { data: user } = useUser();
  const topUpMutation = useTopUpWallet();
  const { Razorpay, isLoading: isRazorpayLoading } = useRazorpay();
  const createOrderMutation = useCreateRazorpayOrder();
  const verifyPaymentMutation = useVerifyRazorpayPayment();

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const order = await createOrderMutation.mutateAsync({ amount });

      const options: RazorpayOrderOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: order.amount,
        currency: order.currency,
        name: "Cheap Ship",
        description: "Wallet Top-up",
        order_id: order.id,
        handler: (response) => {
          verifyPaymentMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: amount,
          });
          setShowTopUp(false);
          setTopUpAmount("");
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.mobile,
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp1 = new Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error("Payment initiation failed", error);
    }
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 h-4 data-vertical:self-auto"
          />
          <h1 className="text-base font-medium">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2.5 bg-muted/30 border rounded-2xl ">
            <div className="size-5 rounded-xl  flex items-center justify-center text-primary">
              <HugeiconsIcon color="green" icon={RupeeSquareIcon} size={25} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">₹{Number(user?.wallet_balance || 0).toLocaleString("en-IN")}</span>
            </div>
            <Separator orientation="vertical" className="h-9 mx-1" />
            <Button size="icon" onClick={() => setShowTopUp(true)} className="size-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
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
          <DialogFooter>
            <Button
              onClick={handleTopUp}
              disabled={createOrderMutation.isPending || isRazorpayLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
            >
              {createOrderMutation.isPending || isRazorpayLoading ? "Processing..." : "Pay Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </header>
  )
}
