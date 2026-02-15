import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { RupeeSquareIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useTransactions, useTopUpWallet } from "@/lib/hooks/use-transactions";
import { useState } from "react";

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

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;

    topUpMutation.mutate({ amount }, {
      onSuccess: () => {
        setShowTopUp(false);
        setTopUpAmount("");
      }
    });
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
          <div className="flex items-center gap-2 pr-2.5 bg-muted/90 border-border/50 rounded-2xl ">
            <div className="size-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-primary">
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
              className="w-full h-11 font-bold"
              onClick={handleTopUp}
              disabled={topUpMutation.isPending || !topUpAmount}
            >
              {topUpMutation.isPending ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin" /> : "PROCEED TO PAY"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </header>
  )
}
