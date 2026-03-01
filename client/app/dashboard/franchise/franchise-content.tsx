"use client";

import * as React from "react";
import { useState } from "react";
import { 
  useFranchisesList, 
  useMyReferralCode, 
  useUpdateFranchiseRate, 
  useMyReferralCommissions,
  useReferralNetworkStats,
  Franchise
} from "@/lib/hooks/use-franchise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserGroupIcon, 
  Copy01Icon, 
  CheckmarkCircle01Icon,
  Store01Icon,
  PercentIcon,
  Package01Icon,
  AiNetworkIcon,
} from "@hugeicons/core-free-icons";
import { sileo } from "sileo";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FranchiseOrdersDataTable } from "./franchise-orders-data-table";
import { PartnersTable } from "./partners-table";
import { YieldLogs } from "./yield-logs";

export default function FranchisePage() {
  const { data: franchiseData, isLoading: loadingFranchises } = useFranchisesList();
  const { data: myReferral, isLoading: loadingReferral } = useMyReferralCode();
  const { data: networkStats, isLoading: loadingNetworkStats } = useReferralNetworkStats();
  const { data: referralCommissions, isLoading: loadingReferralCommissions } = useMyReferralCommissions('pending');
  const updateRateMutation = useUpdateFranchiseRate();

  const franchises = franchiseData?.franchises || [];
  const userBounds = franchiseData?.bounds;

  const [state, setState] = useState({
    selectedFranchiseId: null as string | null,
    showOrdersSheet: false,
    showRatesSheet: false,
    copied: false,
    tempCommissionRate: 5,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const getReferralLink = () => {
    // if (myReferral?.referral_link) return myReferral.referral_link;
    if (myReferral?.referer_code) return `${window.location.origin}/register?ref=${myReferral.referer_code}`;
    return "";
  };

  const referralLink = getReferralLink();

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setState(prev => ({ ...prev, copied: true }));
      sileo.success({ title: "Copied!" , description : "Referral link copied to clipboard!" });
      setTimeout(() => setState(prev => ({ ...prev, copied: false })), 2000);
    }
  };

  const selectedFranchise = (franchises as Franchise[])?.find((f: Franchise) => f.id === state.selectedFranchiseId);

  const networkMetrics = React.useMemo(() => {
    if (!franchises) return { totalProfit: 0, totalShipmentCost: 0, totalWithdrawable: 0 };
    return franchises.reduce((acc: any, f: Franchise) => ({
      totalProfit: acc.totalProfit + (Number(f.total_profit) || 0),
      totalShipmentCost: acc.totalShipmentCost + (Number(f.total_base_shipping_charge) || 0),
      totalWithdrawable: acc.totalWithdrawable + (Number(f.balance) || 0),
    }), { totalProfit: 0, totalShipmentCost: 0, totalWithdrawable: 0 });
  }, [franchises]);

  const effectiveLimits = React.useMemo(() => {
    if (!userBounds) return { min: 0, max: 100 };
    return { min: userBounds.min_rate, max: userBounds.max_rate };
  }, [userBounds]);

  if (loadingFranchises || loadingReferral || loadingNetworkStats) {
    return (
      <div className="max-w-7xl mx-auto p-5 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {["f-1", "f-2", "f-3"].map((id) => <Card key={id}><CardContent className="p-6"><Skeleton className="h-9 w-32" /></CardContent></Card>)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in p-5 fade-in duration-500 pb-32">
      {/* Referral Link Header */}
      {myReferral && (
        <Card className="bg-primary/5 border-primary/10 shadow-none">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-full border border-primary/20">
                <HugeiconsIcon icon={UserGroupIcon} size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Invite Franchise Partners</p>
                <p className="text-xs text-muted-foreground">Share your referral link to earn on every shipment they book</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <code className="text-xs bg-background px-3 py-2 rounded-md border flex-1 md:flex-none font-mono truncate max-w-[300px]">
                {referralLink}
              </code>
              <Button size="sm" variant="outline" onClick={copyReferralLink} className="gap-2">
                <HugeiconsIcon icon={state.copied ? CheckmarkCircle01Icon : Copy01Icon} size={16} />
                {state.copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partner Balances (Withdrawable)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(networkMetrics.totalWithdrawable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {franchises.length} active partners in your network
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifetime Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(networkMetrics.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total earnings from partner mark-ups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Network Yield Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userBounds?.min_rate ?? 0}% - {userBounds?.max_rate ?? 100}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Markup limits allowed for your partners
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="partners" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="partners" className="gap-2">
            <HugeiconsIcon icon={Store01Icon} size={16} />
            Partners ({franchises.length})
          </TabsTrigger>
          <TabsTrigger value="yield" className="gap-2">
            <HugeiconsIcon icon={AiNetworkIcon} size={16} />
            Yield Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <PartnersTable 
                franchises={franchises as Franchise[]}
                onViewOrders={(id) => setState(prev => ({ ...prev, selectedFranchiseId: id, showOrdersSheet: true }))}
                onEditRate={(f) => setState(prev => ({
                  ...prev,
                  selectedFranchiseId: f.id,
                  tempCommissionRate: Number(f.commission_rate) || 5,
                  showRatesSheet: true
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yield" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <YieldLogs 
                networkStats={networkStats}
                referralCommissions={referralCommissions}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheet for Partner Shipments */}
      <Sheet open={state.showOrdersSheet} onOpenChange={(open) => setState(prev => ({ ...prev, showOrdersSheet: open }))}>
        <SheetContent side="right" className="sm:max-w-7xl flex flex-col h-full p-0">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                <HugeiconsIcon icon={Package01Icon} size={20} className="text-primary" />
              </div>
              <div>
                <SheetTitle>{selectedFranchise?.name}&apos;s Orders</SheetTitle>
                <SheetDescription>Detailed shipment logs for this partner</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            {state.selectedFranchiseId && (
              <FranchiseOrdersDataTable 
                franchiseId={state.selectedFranchiseId} 
                franchiseName={selectedFranchise?.name || ""} 
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet for Yield Rate Edit */}
      <Sheet open={state.showRatesSheet} onOpenChange={(open) => setState(prev => ({ ...prev, showRatesSheet: open }))}>
        <SheetContent side="right" className="sm:max-w-md flex flex-col h-full p-0">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                <HugeiconsIcon icon={PercentIcon} size={20} className="text-primary" />
              </div>
              <div>
                <SheetTitle>Configure Yield</SheetTitle>
                <SheetDescription>Edit mark-up rate for {selectedFranchise?.name}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="p-6 space-y-6 flex-1">
            <div className="p-4 bg-muted/30 rounded-lg border text-xs text-muted-foreground leading-relaxed">
              This markup % is added to the base courier charges. A 10% rate on a ₹100 shipment means the partner pays ₹110, netting you ₹10 profit.
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase">Commission Rate (%)</Label>
              <div className="relative">
                <Input 
                  type="number" value={state.tempCommissionRate} onChange={(e) => setState(prev => ({ ...prev, tempCommissionRate: parseFloat(e.target.value) || 0 }))}
                  min={effectiveLimits.min} max={effectiveLimits.max} className="h-12 text-xl font-bold pr-12"
                />
                <HugeiconsIcon icon={PercentIcon} size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Allowed Range: {effectiveLimits.min}% — {effectiveLimits.max}%</p>
            </div>
          </div>
          <SheetFooter className="p-6 border-t">
            <Button variant="outline" className="w-full mb-2" onClick={() => setState(prev => ({ ...prev, showRatesSheet: false }))}>Cancel</Button>
            <Button className="w-full" onClick={() => {
              if (state.selectedFranchiseId) {
                updateRateMutation.mutate({ franchiseId: state.selectedFranchiseId, commission_rate: state.tempCommissionRate });
                setState(prev => ({ ...prev, showRatesSheet: false }));
              }
            }} disabled={updateRateMutation.isPending}>
              {updateRateMutation.isPending ? "Updating..." : "Update Rate"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
