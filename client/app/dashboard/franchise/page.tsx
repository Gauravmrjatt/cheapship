"use client";

import * as React from "react";
import { useState } from "react";
import { 
  useFranchisesList, 
  useMyReferralCode, 
  useUpdateFranchiseRate, 
  useFranchiseOrders, 
  useWithdrawCommission,
  useMyReferralCommissions,
  useWithdrawReferralCommissions,
  useReferralNetworkStats,
  FranchiseOrder,
  Franchise,
  ReferralNetworkStats,
  ReferralCommission
} from "@/lib/hooks/use-franchise";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserGroupIcon, 
  Copy01Icon, 
  CheckmarkCircle01Icon,
  ShoppingBasket01Icon,
  PercentIcon,
  Store01Icon,
  SearchIcon,
  FilterIcon,
  ArrowLeftDoubleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  Loading03Icon,
  DeliveryTruck01Icon,
  Cancel01Icon,
  Wallet01Icon,
  MoneyReceiveCircleIcon,
  Layers01Icon,
  AiNetworkIcon
} from "@hugeicons/core-free-icons";
    import { sileo } from "sileo";
    import { Badge } from "@/components/ui/badge";import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { cn } from "@/lib/utils";

function FranchiseOrdersDataTable({ franchiseId, franchiseName }: { franchiseId: string, franchiseName: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useFranchiseOrders(franchiseId, page, pageSize, status);

  const filteredOrders = React.useMemo(() => {
    if (!data?.data) return [];
    if (!search) return data.data;
    return data.data.filter((order: FranchiseOrder) => 
      order.id.toString().toLowerCase().includes(search.toLowerCase()) ||
      order.shipment_status.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={status}
        onValueChange={setStatus}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
              <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 lg:w-64">
              <HugeiconsIcon icon={SearchIcon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-9 h-9 bg-muted/30 border-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Order Details</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                  {/* <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">Base Amount</TableHead> */}
                  {/* <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Comm %</TableHead> */}
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">Total Amount</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center text-primary">Your Profit</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <HugeiconsIcon icon={ShoppingBasket01Icon} size={48} />
                        <p className="mt-2 font-medium">No orders found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order: FranchiseOrder) => (
                    <TableRow key={order.id} className="hover:bg-muted/30 group">
                      <TableCell>
                        <span className="text-foreground font-medium uppercase">
                          #{order.id.toString().slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const status = order.shipment_status.toLowerCase();
                          return (
                            <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
                              {status === "delivered" ? (
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="fill-green-500 dark:fill-green-400 size-3" />
                              ) : status === "pending" ? (
                                <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin size-3" />
                              ) : status === "cancelled" ? (
                                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="text-red-500 size-3" />
                              ) : (
                                <HugeiconsIcon icon={DeliveryTruck01Icon} strokeWidth={2} className="text-blue-500 size-3" />
                              )}
                              {status.replace(/_/g, " ")}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      {/* <TableCell className="text-right tabular-nums font-medium text-muted-foreground">
                        ₹{Number(order.base_shipping_charge || 0).toLocaleString("en-IN")}
                      </TableCell> */}
                      {/* <TableCell className="text-center">
                       
                      </TableCell> */}
                      <TableCell className="text-right tabular-nums font-medium">
                        ₹{Number(order.shipping_charge || order.total_amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className=" tabular-nums font-medium text-center text-green-600">
                        +₹{Number(order.franchise_commission_amount || 0).toLocaleString("en-IN")} 
                         <Badge variant="outline" className="text-muted-foreground px-1.5 capitalize gap-1.5">
                          <HugeiconsIcon icon={PercentIcon} size={12} strokeWidth={2} className="text-primary" />
                          {Number(order.franchise_commission_rate || 0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between bg-background sticky bottom-0 z-20">
            <div className="text-xs text-muted-foreground font-medium">
              Showing {filteredOrders.length} of {data.pagination.total} orders
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              </Button>
              <div className="text-xs font-bold px-2">
                {page} / {data.pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(data.pagination.totalPages)}
                disabled={page === data.pagination.totalPages}
              >
                <HugeiconsIcon icon={ArrowRightDoubleIcon} size={14} />
              </Button>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}

export default function FranchisePage() {
  const { data: franchiseData, isLoading: loadingFranchises } = useFranchisesList();
  const { data: myReferral, isLoading: loadingReferral } = useMyReferralCode();
  const { data: networkStats, isLoading: loadingNetworkStats } = useReferralNetworkStats();
  const { data: referralCommissions, isLoading: loadingReferralCommissions } = useMyReferralCommissions('pending');
  const updateRateMutation = useUpdateFranchiseRate();
  const withdrawMutation = useWithdrawCommission();
  const withdrawReferralMutation = useWithdrawReferralCommissions();

  const franchises = franchiseData?.franchises;
  const userBounds = franchiseData?.bounds;

  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null);
  const [showOrdersSheet, setShowOrdersSheet] = useState(false);
  const [showRatesSheet, setShowRatesSheet] = useState(false);
  const [showReferralCommissionsSheet, setShowReferralCommissionsSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tempCommissionRate, setTempCommissionRate] = useState<number>(5);

  const copyReferralLink = () => {
    if (myReferral?.referral_link) {
      navigator.clipboard.writeText(myReferral.referral_link);
      setCopied(true);
      sileo.success({ title: "copied!" , description : "Referral link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManage = (id: string) => {
    setSelectedFranchiseId(id);
    setShowOrdersSheet(true);
  };

  const handleWithdraw = (id: string, balance: number) => {
    if (balance <= 0) {
      sileo.error({ title: "Insufficient Balance" , description : "No balance available to withdraw" });
      return;
    }
    
    if (confirm(`Are you sure you want to withdraw ₹${balance}?`)) {
      withdrawMutation.mutate({ franchiseId: id, amount: balance });
    }
  };

  const handleAssignRates = (id: string) => {
    setSelectedFranchiseId(id);
    const franchise = franchises?.find((f: Franchise) => f.id === id);
    setTempCommissionRate(Number(franchise?.commission_rate) || 5);
    setShowRatesSheet(true);
  };

  const saveRates = () => {
    if (selectedFranchiseId) {
      updateRateMutation.mutate({
        franchiseId: selectedFranchiseId,
        commission_rate: tempCommissionRate
      });
      setShowRatesSheet(false);
    }
  };

  const selectedFranchise = franchises?.find((f: Franchise) => f.id === selectedFranchiseId);

  const networkMetrics = React.useMemo(() => {
    if (!franchises) return { totalProfit: 0, totalShipmentCost: 0, totalActive: 0, totalWithdrawable: 0, totalPending: 0 };
    return franchises.reduce((acc: any, f: Franchise) => ({
      totalProfit: acc.totalProfit + (Number(f.total_profit) || 0),
      totalShipmentCost: acc.totalShipmentCost + (Number(f.total_base_shipping_charge) || 0),
      totalActive: acc.totalActive + (f.is_active ? 1 : 0),
      totalWithdrawable: acc.totalWithdrawable + (Number(f.withdrawable_profit) || 0),
      totalPending: acc.totalPending + (Number(f.pending_profit) || 0)
    }), { totalProfit: 0, totalShipmentCost: 0, totalActive: 0, totalWithdrawable: 0, totalPending: 0 });
  }, [franchises]);

  // Get user's commission bounds
  const effectiveLimits = React.useMemo(() => {
    if (!userBounds) return { min: 0, max: 100 };
    return {
      min: userBounds.min_rate,
      max: userBounds.max_rate
    };
  }, [userBounds]);

  if (loadingFranchises || loadingReferral || loadingNetworkStats) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i: number) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            Franchise Network
          </h1>
          <p className="text-sm text-muted-foreground">Manage your referred partners and their commission rates</p>
        </div>
        
        {myReferral && (
          <Card className="bg-primary/5 border-primary/20 rounded-xl overflow-hidden shadow-none">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-primary/60 tracking-wider">Your Referral Link</p>
                <p className="text-xs font-mono font-medium truncate max-w-[200px]">{myReferral.referral_link}</p>
              </div>
              <Button size="icon" variant="ghost" className="size-8 text-primary hover:bg-primary/10" onClick={copyReferralLink}>
                <HugeiconsIcon icon={copied ? CheckmarkCircle01Icon : Copy01Icon} size={16} />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-none ring-1 ring-foreground/10 bg-card/50 shadow-lg shadow-foreground/5 p-6 flex flex-col gap-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Network Cost</p>
          <p className="text-xl font-bold">₹{networkMetrics.totalShipmentCost.toLocaleString("en-IN")}</p>
        </Card>
        <Card className="rounded-2xl border-none ring-1 ring-foreground/10 bg-primary/5 shadow-lg shadow-primary/5 p-6 flex flex-col gap-1">
          <p className="text-[10px] uppercase font-bold text-primary/60 tracking-wider">Net Profit</p>
          <p className="text-xl font-bold text-primary">₹{networkMetrics.totalProfit.toLocaleString("en-IN")}</p>
        </Card>
        <Card className="rounded-2xl border-none ring-1 ring-foreground/10 bg-green-500/5 shadow-lg shadow-green-500/5 p-6 flex flex-col gap-1">
          <p className="text-[10px] uppercase font-bold text-green-600/60 tracking-wider">Withdrawable</p>
          <p className="text-xl font-bold text-green-600">₹{networkMetrics.totalWithdrawable.toLocaleString("en-IN")}</p>
        </Card>
        <Card 
          className="rounded-2xl border-none ring-1 ring-foreground/10 bg-purple-500/5 shadow-lg shadow-purple-500/5 p-6 flex flex-col gap-1 cursor-pointer hover:bg-purple-500/10 transition-colors"
          onClick={() => setShowReferralCommissionsSheet(true)}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-purple-600/60 tracking-wider">Referral Commissions</p>
            <HugeiconsIcon icon={AiNetworkIcon} className="size-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-600">
            ₹{(networkStats?.pending_withdrawable || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {networkStats?.total_commissions || 0} total commissions · Click to view
          </p>
        </Card>
        <Card className="rounded-2xl border-none ring-1 ring-foreground/10 bg-blue-500/5 shadow-lg shadow-blue-500/5 p-6 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-blue-600/60 tracking-wider">Your Commission Bounds</p>
            <HugeiconsIcon icon={PercentIcon} className="size-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600">
            {userBounds?.min_rate ?? 0}% - {userBounds?.max_rate ?? 100}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            Set by admin · Limits your franchise rates
          </p>
        </Card>
      </div>

      {!franchises || franchises.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2 bg-transparent flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="w-48 h-48 relative opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <Image 
              src="/assets/svg/delivery2.svg" 
              alt="No franchises" 
              fill
              className="object-contain"
            />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-semibold">No Franchises Yet</h3>
            <p className="text-sm text-muted-foreground">
              Share your referral link with others to start building your network. You&apos;ll earn commission on every order they place.
            </p>
          </div>
          <Button onClick={copyReferralLink} className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20">
            <HugeiconsIcon icon={Copy01Icon} size={18} />
            COPY REFERRAL LINK
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {franchises.map((f: Franchise) => (
            <Card key={f.id} className="rounded-2xl border-none ring-1 ring-foreground/10 bg-card/50 shadow-lg shadow-foreground/5 hover:bg-card/80 transition-all group overflow-hidden min-w-[500px]">
              <CardHeader className="p-5 pb-2">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold py-0 px-2 rounded-lg border-primary/20 bg-primary/5 text-primary">
                    {f._count?.orders || 0} ORDERS
                  </Badge>
                </div>
                <div className="mt-3">
                  <CardTitle className="text-base font-semibold">{f.name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{f.referer_code}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="opacity-60">Email:</span>
                      <span className="text-foreground font-medium truncate max-w-[120px]">{f.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="opacity-60">Mobile:</span>
                      <span className="text-foreground font-medium">{f.mobile}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="opacity-60">Rate:</span>
                      <Badge variant="secondary" className="text-[10px] h-4 font-bold">{Number(f.commission_rate) ||0}%</Badge>
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-xl p-3 flex flex-col justify-center items-end border border-primary/10">
                    <p className="text-[10px] uppercase font-bold text-primary/60 tracking-wider">Balance</p>
                    <p className="text-lg font-bold text-primary">₹{Number(f.balance || 0).toLocaleString("en-IN")}</p>
                    <div className="flex flex-col items-end mt-1 text-[9px] text-muted-foreground font-medium">
                      <p>Shipment Cost: ₹{Number(f.total_base_shipping_charge || 0).toLocaleString("en-IN")}</p>
                      <p className="text-green-600">Net Profit: ₹{Number(f.total_profit || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl text-[10px] font-bold h-9" onClick={() => handleManage(f.id)}>
                    <HugeiconsIcon icon={Store01Icon} size={14} />
                    MANAGE
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl text-[10px] font-bold h-9" onClick={() => handleAssignRates(f.id)}>
                    <HugeiconsIcon icon={PercentIcon} size={14} />
                    RATES
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 rounded-xl text-[10px] font-bold h-9 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" 
                    onClick={() => handleWithdraw(f.id, f.balance)}
                    disabled={withdrawMutation.isPending || !f.balance || f.balance <= 0}
                  >
                    <HugeiconsIcon icon={MoneyReceiveCircleIcon} size={14} />
                    {withdrawMutation.isPending ? "..." : "WITHDRAW"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Orders Sheet */}
      <Sheet open={showOrdersSheet} onOpenChange={setShowOrdersSheet}>
        <SheetContent side="right" className="sm:max-w-7xl flex flex-col h-full p-0 min-w-[100dvw]">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={ShoppingBasket01Icon} size={20}  />
              Orders by {selectedFranchise?.name}
            </SheetTitle>
            <SheetDescription>Real-time analytics and lifecycle of partner shipments</SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden">
            {selectedFranchiseId && (
              <FranchiseOrdersDataTable 
                franchiseId={selectedFranchiseId} 
                franchiseName={selectedFranchise?.name || ""} 
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Assign Rates Sheet */}
      <Sheet open={showRatesSheet} onOpenChange={setShowRatesSheet}>
        <SheetContent side="right" className="min-w-dvw  md:min-w-[50dvw] flex flex-col h-full p-0">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <HugeiconsIcon icon={PercentIcon} size={20} />
              </div>
              <div>
                <SheetTitle className="text-xl">Assign Rates to {selectedFranchise?.name}</SheetTitle>
                <SheetDescription>Configure commission for {selectedFranchise?.name}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <Card className="border-none bg-muted/30 shadow-none">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
                  <span className="text-sm font-semibold uppercase tracking-wider">Yield Optimization</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The commission rate is a markup percentage added to the base courier charges. 
                  For example, if the courier charges ₹50 and you set a 20% commission, 
                  the franchise will be charged ₹60, and your profit will be ₹10.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commission-rate" className="text-sm font-medium">
                  Commission Rate (%)
                </Label>
                <div className="relative">
                  <Input 
                    id="commission-rate"
                    type="number" 
                    value={tempCommissionRate} 
                    onChange={(e) => setTempCommissionRate(parseFloat(e.target.value) || 0)}
                    placeholder="5"
                    min={effectiveLimits.min}
                    max={effectiveLimits.max}
                    className="h-12 text-lg font-semibold pr-12 focus-visible:ring-1"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <HugeiconsIcon icon={PercentIcon} size={18} />
                  </div>
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Rate must be between {effectiveLimits.min}% and {effectiveLimits.max}% (your set bounds).
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="p-6 border-t mt-auto">
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1 h-11" 
                onClick={() => setShowRatesSheet(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-11" 
                onClick={saveRates}
                disabled={updateRateMutation.isPending}
              >
                {updateRateMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                    Updating...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Referral Commissions Sheet */}
      <Sheet open={showReferralCommissionsSheet} onOpenChange={setShowReferralCommissionsSheet}>
        <SheetContent side="right" className="min-w-dvw md:min-w-[50dvw] flex flex-col h-full p-0">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <HugeiconsIcon icon={AiNetworkIcon} size={20} />
              </div>
              <div>
                <SheetTitle className="text-xl">Multi-Level Referral Commissions</SheetTitle>
                <SheetDescription>View and withdraw commissions from your referral network</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none bg-purple-500/5 shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{(networkStats?.total_amount || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-green-500/5 shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    ₹{(networkStats?.pending_withdrawable || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground">Available to Withdraw</p>
                </CardContent>
              </Card>
            </div>

            {/* Level Breakdown */}
            {networkStats?.level_breakdown && networkStats.level_breakdown.length > 0 && (
              <Card className="border-none bg-muted/30 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HugeiconsIcon icon={Layers01Icon} className="size-4" />
                    Commission by Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {networkStats.level_breakdown.map((level: ReferralNetworkStats['level_breakdown'][0]) => (
                      <div key={level.level} className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Level {level.level}</Badge>
                          <span className="text-sm text-muted-foreground">{level.count} orders</span>
                        </div>
                        <span className="font-semibold">₹{level.total_amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Commissions */}
            {referralCommissions && referralCommissions.commissions.length > 0 && (
              <Card className="border-none shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Pending Commissions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {referralCommissions.commissions.slice(0, 10).map((commission: ReferralCommission) => (
                      <div key={commission.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Level {commission.level}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Order #{commission.order_id.toString().slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {commission.order.customer_name || 'Unknown'} · {new Date(commission.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-semibold text-green-600">+₹{commission.amount}</span>
                      </div>
                    ))}
                    {referralCommissions.commissions.length > 10 && (
                      <p className="text-xs text-center text-muted-foreground py-2">
                        +{referralCommissions.commissions.length - 10} more commissions
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <SheetFooter className="p-6 border-t mt-auto">
            <div className="w-full space-y-3">
              {(networkStats?.pending_withdrawable || 0) > 0 && (
                <Button 
                  className="w-full h-12 font-bold bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (confirm(`Withdraw ₹${networkStats?.pending_withdrawable || 0} in referral commissions?`)) {
                      withdrawReferralMutation.mutate();
                    }
                  }}
                  disabled={withdrawReferralMutation.isPending}
                >
                  {withdrawReferralMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <HugeiconsIcon icon={MoneyReceiveCircleIcon} className="mr-2 size-5" />
                      Withdraw ₹{(networkStats?.pending_withdrawable || 0).toLocaleString("en-IN")}
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full h-11"
                onClick={() => setShowReferralCommissionsSheet(false)}
              >
                Close
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}