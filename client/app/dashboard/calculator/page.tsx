"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Calculator01Icon, 
  InformationCircleIcon, 
  Location01Icon, 
  WeightScale01Icon,
  Package01Icon,
  FlashIcon,
  RotateLeft01Icon,
  Alert01Icon,
  StarIcon,
  TruckIcon,
  Loading03Icon,
  ArtificialIntelligence01Icon,
  SquareRootSquareIcon,
  Navigation01Icon,
  CheckmarkCircle01Icon
} from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useHttp } from "@/lib/hooks/use-http";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface CourierPartner {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  rating: string;
  etd: string;
  etd_hours: number;
  chargeable_weight: number;
  cod: number;
  mode: string;
}

export default function RateCalculatorPage() {
  const [showRates, setShowRates] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    pickupPincode: "281306",
    deliveryPincode: "281308",
    actualWeight: "25",
    length: "50",
    width: "50",
    height: "50",
    paymentType: "PREPAID",
    shipmentValue: "500",
    dangerousGoods: false,
  });

  const http = useHttp();

  const volumetricWeight = useMemo(() => {
    const l = parseFloat(formData.length) || 0;
    const w = parseFloat(formData.width) || 0;
    const h = parseFloat(formData.height) || 0;
    return (l * w * h) / 5000;
  }, [formData.length, formData.width, formData.height]);

  const queryParams = new URLSearchParams({
    pickup_postcode: formData.pickupPincode,
    delivery_postcode: formData.deliveryPincode,
    weight: formData.actualWeight,
    cod: formData.paymentType === "COD" ? "1" : "0",
    declared_value: formData.shipmentValue,
    length: formData.length,
    breadth: formData.width,
    height: formData.height,
  }).toString();

  const { data, isLoading, isError, refetch } = useQuery<{
    success: boolean;
    data: {
      available_courier_companies: CourierPartner[];
    };
  }>(
    http.get(
      ["calculate-rates", queryParams],
      `/orders/calculate-rates?${queryParams}`,
      false
    )
  );

  const handleCalculate = () => {
    setShowRates(true);
    refetch();
  };

  const handleReset = () => {
    setShowRates(false);
    setFormData({
      pickupPincode: "",
      deliveryPincode: "",
      actualWeight: "",
      length: "",
      width: "",
      height: "",
      paymentType: "PREPAID",
      shipmentValue: "",
      dangerousGoods: false,
    });
  };

  const partners = data?.data?.available_courier_companies ?? [];
  const filteredPartners = partners.filter(p => {
    if (activeTab === "all") return true;
    return p.mode.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-1 px-2">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <HugeiconsIcon icon={Calculator01Icon} size={24} className="text-primary" />
          Rate Calculator
        </h1>
        <p className="text-sm text-muted-foreground">Estimate shipping costs and compare partners in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/50 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Shipment Details</CardTitle>
                  <CardDescription>Provide package parameters for accurate pricing</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleReset}>
                  <HugeiconsIcon icon={RotateLeft01Icon} size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Addresses</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      value={formData.pickupPincode}
                      onChange={(e) => setFormData({...formData, pickupPincode: e.target.value})}
                      placeholder="Pickup Pin"
                      className="h-9"
                    />
                    <Input 
                      value={formData.deliveryPincode}
                      onChange={(e) => setFormData({...formData, deliveryPincode: e.target.value})}
                      placeholder="Delivery Pin"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Package Weight (KG)</Label>
                  <Input 
                    value={formData.actualWeight}
                    onChange={(e) => setFormData({...formData, actualWeight: e.target.value})}
                    placeholder="25"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dimensions (CM)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {["length", "width", "height"].map((dim) => (
                    <Input 
                      key={dim}
                      value={formData[dim as keyof typeof formData] as string} 
                      onChange={(e) => setFormData({...formData, [dim]: e.target.value})} 
                      className="h-9 text-center" 
                      placeholder={dim.charAt(0).toUpperCase() + dim.slice(1)} 
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={formData.paymentType} onValueChange={(v) => setFormData({...formData, paymentType: v})}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PREPAID">Prepaid</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                      <Input 
                        value={formData.shipmentValue}
                        onChange={(e) => setFormData({...formData, shipmentValue: e.target.value})}
                        className="h-9 pl-6"
                        placeholder="Value"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-border bg-muted/30">
                    <Checkbox 
                      id="dangerous" 
                      checked={formData.dangerousGoods}
                      onCheckedChange={(checked) => setFormData({...formData, dangerousGoods: !!checked})}
                    />
                    <Label htmlFor="dangerous" className="text-xs font-medium cursor-pointer text-muted-foreground">
                      Contains Dangerous / Liquid?
                    </Label>
                  </div>
                </div>
              </div>

              <Button className="w-full h-10 font-semibold gap-2" onClick={handleCalculate} disabled={isLoading}>
                {isLoading ? (
                  <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" />
                ) : (
                  <HugeiconsIcon icon={FlashIcon} size={18} />
                )}
                {isLoading ? "CALCULATING..." : "Get Instant Rates"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/50 border-b">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={SquareRootSquareIcon} size={18} className="text-primary" />
                <CardTitle className="text-sm font-semibold">Volumetric Weight</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Result</p>
                    <p className="text-3xl font-bold tracking-tight">{volumetricWeight.toFixed(2)} <span className="text-sm font-medium">KG</span></p>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">SURFACE</Badge>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(volumetricWeight * 2, 100)}%` }} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Calculation Formula</p>
                  <div className="p-3 bg-muted rounded-lg font-mono text-[10px] text-muted-foreground break-all">
                    ({formData.length || 0}L × {formData.width || 0}W × {formData.height || 0}H) / 5000 = {volumetricWeight.toFixed(2)} KG
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-primary" />
                    <span>Standard Divisor: 5000</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-primary" />
                    <span>Higher weight priority</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6 flex gap-3">
              <HugeiconsIcon icon={InformationCircleIcon} size={18} className="text-primary shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Quick Insights</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We compare Dead Weight vs Volumetric Weight and automatically recommend the most cost-effective path.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showRates && (
          <div className="lg:col-span-12 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Separator />
            
            {isLoading ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
                <Card className="border shadow-sm overflow-hidden">
                  <div className="bg-muted h-10 w-full border-b" />
                  <div className="p-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-6 border-b last:border-0">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                        <div className="space-y-1 text-right">
                          <Skeleton className="h-6 w-20 ml-auto" />
                          <Skeleton className="h-3 w-16 ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ) : isError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-12 text-center shadow-sm">
                <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive mx-auto mb-4" />
                <h3 className="font-semibold text-destructive">Pricing Service Offline</h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">We couldn't reach the real-time rate service. Please check your network and retry.</p>
                <Button variant="outline" size="sm" className="mt-6 border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => refetch()}>Retry Connection</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight">Available Couriers</h2>
                    <p className="text-xs text-muted-foreground">Found {filteredPartners.length} optimized results for your route</p>
                  </div>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
                    <TabsList className="h-9">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      <TabsTrigger value="air" className="text-xs">Air</TabsTrigger>
                      <TabsTrigger value="surface" className="text-xs">Surface</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr className="border-b">
                          <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Logistics Partner</th>
                          <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Rating</th>
                          <th className="px-6 py-3 text-xs font-semibold text-muted-foreground text-right">Final Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredPartners.map((courier, idx) => (
                          <tr key={idx} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{courier.courier_name}</span>
                                {idx === 0 && <Badge variant="outline" className="text-[10px] px-1.5">BEST VALUE</Badge>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">{courier.mode}</span>
                                <span className="text-[10px] text-muted-foreground/60">• {courier.etd}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <HugeiconsIcon icon={StarIcon} size={12} className="fill-yellow-500 text-yellow-500" />
                                <span className="font-semibold text-sm">{courier.rating || "4.2"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-lg">₹{courier.rate}</span>
                                <span className="text-[10px] text-muted-foreground">All-Inclusive</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted border flex gap-3">
                  <HugeiconsIcon icon={Alert01Icon} size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Note: Rates are calculated using our latest pricing engine. Dimensional accuracy is vital to prevent weight disputes. Inclusive of fuel surcharges.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}