"use client";

import * as React from "react";
import { useState } from "react";
import { useFranchisesList, useMyReferralCode, useUpdateFranchiseRate, useFranchiseOrders, FranchiseOrder } from "@/lib/hooks/use-franchise";
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
  DeliveryTruck01Icon
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

const serviceProviders = [
  { id: 1, name: "Delhivery", logo: "/assets/svg/Delivery.svg", type: "Domestic" },
  { id: 2, name: "Amazon Surface", logo: "/assets/svg/delivery2.svg", type: "Domestic" },
];

function FranchiseOrdersDataTable({ franchiseId, franchiseName }: { franchiseId: string, franchiseName: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useFranchiseOrders(franchiseId, page, pageSize, status);

  const filteredOrders = React.useMemo(() => {
    if (!data?.data) return [];
    if (!search) return data.data;
    return data.data.filter(order => 
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
        <div className="flex items-center justify-between px-6 py-4 border-b">
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
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Order ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Type</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <HugeiconsIcon icon={ShoppingBasket01Icon} size={48} />
                        <p className="mt-2 font-medium">No orders found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30 group">
                      <TableCell className="font-mono text-xs font-medium">
                        #{order.id.toString().slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 uppercase">
                          {order.order_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold py-0 h-4 gap-1",
                          order.shipment_status === "DELIVERED" && "text-green-600 border-green-200 bg-green-50",
                          order.shipment_status === "CANCELLED" && "text-red-600 border-red-200 bg-red-50",
                          order.shipment_status === "PENDING" && "text-amber-600 border-amber-200 bg-amber-50"
                        )}>
                          {order.shipment_status === "PENDING" && <HugeiconsIcon icon={Loading03Icon} size={10} className="animate-spin" />}
                          {order.shipment_status === "DELIVERED" && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} />}
                          {order.shipment_status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-right">₹{Number(order.total_amount).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground font-medium">
                        {new Date(order.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
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
  const { data: franchises, isLoading: loadingFranchises } = useFranchisesList();
  const { data: myReferral, isLoading: loadingReferral } = useMyReferralCode();
  const updateRateMutation = useUpdateFranchiseRate();
  
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null);
  const [showOrdersSheet, setShowOrdersSheet] = useState(false);
  const [showRatesSheet, setShowRatesSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tempRates, setTempRates] = useState<Record<string, { rate: number; slab: number }>>({});

  const copyReferralLink = () => {
    if (myReferral?.referral_link) {
      navigator.clipboard.writeText(myReferral.referral_link);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManage = (id: string) => {
    setSelectedFranchiseId(id);
    setShowOrdersSheet(true);
  };

  const handleAssignRates = (id: string) => {
    setSelectedFranchiseId(id);
    const franchise = franchises?.find(f => f.id === id);
    // Initialize tempRates with existing assigned_rates or defaults
    const initialRates: Record<string, { rate: number; slab: number }> = {};
    serviceProviders.forEach(p => {
      const providerId = p.id.toString();
      const existing = franchise?.assigned_rates?.[providerId] || (franchise?.assigned_rates as any)?.[p.name] || { rate: undefined, slab: undefined };
      initialRates[providerId] = {
        rate: existing.rate !== undefined ? existing.rate : (Number(franchise?.commission_rate) || 5),
        slab: existing.slab || 500
      };
    });
    setTempRates(initialRates);
    setShowRatesSheet(true);
  };

  const saveRates = () => {
    if (selectedFranchiseId) {
      updateRateMutation.mutate({
        franchiseId: selectedFranchiseId,
        assigned_rates: tempRates
      });
      setShowRatesSheet(false);
    }
  };

  const handleRateChange = (providerId: number, field: 'rate' | 'slab', value: string) => {
    setTempRates(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const selectedFranchise = franchises?.find(f => f.id === selectedFranchiseId);

  if (loadingFranchises || loadingReferral) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
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
          {franchises.map((f) => (
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
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">Email:</span>
                    <span className="text-foreground font-medium">{f.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">Mobile:</span>
                    <span className="text-foreground font-medium">{f.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">Current Rate:</span>
                    <Badge variant="secondary" className="text-[10px] h-4 font-bold">{Number(f.commission_rate) || 5}%</Badge>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl text-[10px] font-bold h-9" onClick={() => handleManage(f.id)}>
                    <HugeiconsIcon icon={Store01Icon} size={14} />
                    MANAGE
                  </Button>
                  <Button size="sm" className="flex-1 rounded-xl text-[10px] font-bold h-9" onClick={() => handleAssignRates(f.id)}>
                    <HugeiconsIcon icon={PercentIcon} size={14} />
                    ASSIGN RATES
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Orders Sheet */}
      <Sheet open={showOrdersSheet} onOpenChange={setShowOrdersSheet}>
        <SheetContent side="right" className="sm:max-w-3xl flex flex-col h-full p-0 min-w-[50dvw]">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={ShoppingBasket01Icon} size={20} className="text-primary" />
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
        <SheetContent side="right" className="sm:max-w-xl flex flex-col h-full p-0 min-w-[50dvw]">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={PercentIcon} size={20} className="text-primary" />
              Protocol Configuration: {selectedFranchise?.name}
            </SheetTitle>
            <SheetDescription>Set how much extra (%) you will charge to this Franchise</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 space-y-6 my-4 custom-scrollbar">
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                Yield Optimization
              </h4>
              <p className="text-xs mt-1 text-muted-foreground leading-relaxed">
                If you set 20% extra, and a courier charges ₹50, the Franchise will be charged ₹60. 
                The extra ₹10 (20%) will be your commission. Default is 5%.
              </p>
            </div>

            <div className="rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider w-12"></TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider">Provider</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider w-24">Markup (%)</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider w-24">Slab (g)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="w-8 h-8 relative grayscale hover:grayscale-0 transition-all">
                          <Image src={provider.logo} alt={provider.name} fill className="object-contain" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{provider.name}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={tempRates[provider.id.toString()]?.rate || 5} 
                          onChange={(e) => handleRateChange(provider.id, 'rate', e.target.value)}
                          className="h-8 text-xs font-bold rounded-lg bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={tempRates[provider.id.toString()]?.slab || 500} 
                          onChange={(e) => handleRateChange(provider.id, 'slab', e.target.value)}
                          placeholder="500" 
                          className="h-8 text-xs font-bold rounded-lg bg-muted/30 border-none ring-1 ring-border focus-visible:ring-primary"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <SheetFooter className="p-6 border-t mt-auto">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 rounded-xl font-bold h-11" onClick={() => setShowRatesSheet(false)}>
                DISCARD
              </Button>
              <Button 
                className="flex-1 rounded-xl font-bold h-11 shadow-lg shadow-primary/20" 
                onClick={saveRates}
                disabled={updateRateMutation.isPending}
              >
                {updateRateMutation.isPending ? "UPLOADING..." : "UPDATE PROTOCOL"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}