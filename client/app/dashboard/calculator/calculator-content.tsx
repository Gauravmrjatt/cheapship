"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InformationCircleIcon,
  Location01Icon,
  FlashIcon,
  RotateLeft01Icon,
  Alert01Icon,
  StarIcon,
  TruckIcon,
  Loading03Icon,
  Navigation01Icon,
  Search01Icon,
  AiCloudIcon,
  RocketIcon,
  Cancel01Icon,
  ArrowRight01Icon
} from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useHttp } from "@/lib/hooks/use-http";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateRateSchema } from "@/lib/validators/order";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { useRateCalculatorStore } from "@/lib/store/rate-calculator";
import { CourierCard, CalculationGuidelines } from "@/components/calculator-components";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
interface LocationInfo {
  city: string;
  state: string;
  postcode: string;
}

interface ShipmentInfo {
  value: string;
  payment_mode: string;
  applicable_weight: string;
  dangerous_goods: string;
}

interface CourierPartner {
  courier_name: string;
  courier_company_id: number;
  rating: number;
  estimated_delivery: string;
  delivery_in_days: string;
  chargeable_weight: number;
  rate: number;
  is_surface: boolean;
  mode: string;
  is_recommended: boolean;
  is_flagged?: boolean;
}

interface RateResponse {
  pickup_location: LocationInfo;
  delivery_location: LocationInfo;
  shipment_info: ShipmentInfo;
  serviceable_couriers: CourierPartner[];
}

const rateCalculatorSchema = calculateRateSchema;

export default function RateCalculatorPage() {
  const [showRates, setShowRates] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();
  const { setRateData } = useRateCalculatorStore();

  type RateCalculatorFormData = z.output<typeof rateCalculatorSchema>;

  const form = useForm<RateCalculatorFormData>({
    resolver: zodResolver(rateCalculatorSchema),
    defaultValues: {
      pickupPincode: "",
      deliveryPincode: "",
      actualWeight: 0,
      length: 0,
      width: 0,
      height: 0,
      paymentType: "PREPAID",
      shipmentValue: 0,
      dangerousGoods: false,
      order_type: "SURFACE",
      is_insured: false,
    },
  });

  const { errors } = form.formState;
  const formValues = form.watch();

  const http = useHttp();

  // Fetch Pickup Locality Details
  const { data: pickupLocality, isLoading: isLoadingPickup } = useQuery(
    http.get(
      ["pincode-details", formValues.pickupPincode],
      `/orders/pincode-details?postcode=${formValues.pickupPincode}`,
      formValues.pickupPincode?.length === 6
    )
  );

  // Fetch Delivery Locality Details
  const { data: deliveryLocality, isLoading: isLoadingDelivery } = useQuery(
    http.get(
      ["pincode-details", formValues.deliveryPincode],
      `/orders/pincode-details?postcode=${formValues.deliveryPincode}`,
      formValues.deliveryPincode?.length === 6
    )
  );

  const volumetricWeight = useMemo(() => {
    const l = Number(formValues.length) || 0;
    const w = Number(formValues.width) || 0;
    const h = Number(formValues.height) || 0;
    return (l * w * h) / 5000;
  }, [formValues.length, formValues.width, formValues.height]);

  const chargeableWeight = useMemo(() => {
    const actualWeight = formValues.actualWeight || 0;
    const isFlyer = actualWeight <= 1000; // 1kg or less
    const volumetric = volumetricWeight;

    // For flyers (1kg or less), use actual weight even if volumetric is higher
    // For all other packages, use the higher of actual or volumetric weight
    return isFlyer ? actualWeight : Math.max(actualWeight, volumetric);
  }, [formValues.actualWeight, volumetricWeight]);

  const queryParams = useMemo(() => new URLSearchParams({
    pickup_postcode: formValues.pickupPincode,
    delivery_postcode: formValues.deliveryPincode,
    weight: (formValues.actualWeight || 0).toString(),
    cod: formValues.paymentType === "COD" ? "1" : "0",
    declared_value: formValues.shipmentValue?.toString(),
    length: formValues.length?.toString(),
    breadth: formValues.width?.toString(),
    height: formValues.height?.toString()
  }).toString(), [formValues]);

  const { data, isLoading, isError, refetch } = useQuery<RateResponse>(
    http.get(
      ["calculate-rates", queryParams],
      `/orders/calculate-rates?${queryParams}`,
      false
    )
  );

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(() => {
      setShowRates(true);
      refetch();
    })(e);
  };

  const handleReset = () => {
    setShowRates(false);
    form.reset({
      pickupPincode: "",
      deliveryPincode: "",
      actualWeight: 0,
      length: 0,
      width: 0,
      height: 0,
      paymentType: "PREPAID",
      shipmentValue: 0,
      dangerousGoods: false,
      order_type: "SURFACE",
    });
  };

  const handleShipNow = (courier: CourierPartner) => {
    setRateData({
      pickupPincode: formValues.pickupPincode,
      deliveryPincode: formValues.deliveryPincode,
      weight: formValues.actualWeight,
      length: formValues.length,
      width: formValues.width,
      height: formValues.height,
      paymentType: formValues.paymentType as "PREPAID" | "COD",
      shipmentValue: formValues.shipmentValue,
      order_type: formValues.order_type as "SURFACE" | "EXPRESS",
      selectedCourier: {
        courier_company_id: courier.courier_company_id,
        courier_name: courier.courier_name,
        rate: courier.rate,
        mode: courier.mode,
        rating: courier.rating,
        estimated_delivery: courier.estimated_delivery,
        delivery_in_days: courier.delivery_in_days,
        chargeable_weight: courier.chargeable_weight,
      },
    });
    const params = new URLSearchParams({
      courier_id: courier.courier_company_id.toString(),
      courier_name: courier.courier_name,
      rate: courier.rate.toString(),
      payment_mode: formValues.paymentType,
    });
    router.push(`/dashboard/orders/new?${params.toString()}`);
  };

  const partners = data?.serviceable_couriers ?? [];
  const filteredPartners = partners
    .sort((a, b) => a.rate - b.rate)
    .filter(p => {
      if (activeTab === "all") return true;
      return p.mode.toLowerCase() === activeTab.toLowerCase();
    });

  const isPickupValid = pickupLocality && (pickupLocality?.success !== false) && (pickupLocality?.data?.postcode_details || pickupLocality?.postcode_details);
  const isDeliveryValid = deliveryLocality && (deliveryLocality?.success !== false) && (deliveryLocality?.data?.postcode_details || deliveryLocality?.postcode_details);
  const canCalculate = isPickupValid && isDeliveryValid;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-700 pb-32">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
          Rate Calculator
        </h1>
      </div>

      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-10 items-start",
        showRates && "flex flex-col-reverse lg:grid"
      )}>

        {/* Left Column: Form & Real-time Stats */}
        <div className="w-full lg:col-span-4 space-y-8">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="space-y-1.5 px-6 pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Shipment Parameters</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 text-muted-foreground"
                  onClick={handleReset}
                  title="Reset Form"
                >
                  <HugeiconsIcon icon={RotateLeft01Icon} size={16} />
                </Button>
              </div>
              <CardDescription>Enter details to get accurate shipping estimates.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleCalculate} className="space-y-6">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pickup Pincode</FieldLabel>
                      <Input
                        {...form.register("pickupPincode")}
                        placeholder="000000"
                        className={cn("font-medium", !isPickupValid && formValues.pickupPincode?.length === 6 && "border-destructive")}
                      />
                      {isLoadingPickup ? (
                        <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">Verifying...</p>
                      ) : isPickupValid ? (
                        <p className="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-tight">
                          {pickupLocality?.data?.postcode_details?.city || pickupLocality?.postcode_details?.city}, {pickupLocality?.data?.postcode_details?.state || pickupLocality?.postcode_details?.state}
                        </p>
                      ) : formValues.pickupPincode?.length === 6 && !isLoadingPickup && (
                        <p className="text-[10px] text-destructive font-bold mt-1 uppercase tracking-tight">Invalid Pincode</p>
                      )}
                      <FieldError errors={[errors.pickupPincode]} />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Pincode</FieldLabel>
                      <Input
                        {...form.register("deliveryPincode")}
                        placeholder="0000000"
                        className={cn("font-medium", !isDeliveryValid && formValues.deliveryPincode?.length === 6 && "border-destructive")}
                      />
                      {isLoadingDelivery ? (
                        <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">Verifying...</p>
                      ) : isDeliveryValid ? (
                        <p className="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-tight">
                          {deliveryLocality?.data?.postcode_details?.city || deliveryLocality?.postcode_details?.city}, {deliveryLocality?.data?.postcode_details?.state || deliveryLocality?.postcode_details?.state}
                        </p>
                      ) : formValues.deliveryPincode?.length === 6 && !isLoadingDelivery && (
                        <p className="text-[10px] text-destructive font-bold mt-1 uppercase tracking-tight">Invalid Pincode</p>
                      )}
                      <FieldError errors={[errors.deliveryPincode]} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actual Weight (g)</FieldLabel>
                      <Input
                        type="number"
                        max={1000000}
                        {...form.register("actualWeight", { valueAsNumber: true })}
                        placeholder="500"
                        className="font-medium"
                      />
                      <FieldError errors={[errors.actualWeight]} />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value (₹)</FieldLabel>
                      <Input
                        {...form.register("shipmentValue", { valueAsNumber: true })}
                        placeholder="500"
                        className="font-medium"
                      />
                      <FieldError errors={[errors.shipmentValue]} />
                    </Field>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dimensions (L x W x H in cm)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        {...form.register("length", { valueAsNumber: true })}
                        placeholder="L"
                        className="text-center font-medium"
                      />
                      <Input
                        {...form.register("width", { valueAsNumber: true })}
                        placeholder="W"
                        className="text-center font-medium"
                      />
                      <Input
                        {...form.register("height", { valueAsNumber: true })}
                        placeholder="H"
                        className="text-center font-medium"
                      />
                    </div>
                  </div>

                  <Field>
                    <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Mode</FieldLabel>
                    <Controller
                      control={form.control}
                      name="paymentType"
                      render={({ field }) => (
                        <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="PREPAID">Prepaid</TabsTrigger>
                            <TabsTrigger value="COD">COD</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      )}
                    />
                  </Field>

                  {/* <Field>
                    <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Mode</FieldLabel>
                    <Controller
                      control={form.control}
                      name="order_type"
                      render={({ field }) => (
                        <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="SURFACE">
                              <HugeiconsIcon icon={TruckIcon} size={14} className="mr-1.5" />
                              Surface
                            </TabsTrigger>
                            <TabsTrigger value="EXPRESS">
                              <HugeiconsIcon icon={RocketIcon} size={14} className="mr-1.5" />
                              Air
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      )}
                    />
                  </Field> */}

                  <div className="flex items-center space-x-2 rounded-lg border p-4 bg-muted/30 ">
                    <Controller
                      control={form.control}
                      name="dangerousGoods"
                      render={({ field }) => (
                        <Checkbox
                          id="dangerous-goods"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="dangerous-goods"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Contains Dangerous Goods
                      </label>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        Liquids, Batteries, Powders
                      </p>
                    </div>
                  </div>
                  {formValues.shipmentValue >= 2500 && (<>
                    <div className="flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/20 w-full animate-in fade-in slide-in-from-top-2">
                      <Controller
                        control={form.control}
                        name="is_insured"
                        render={({ field }) => (
                          <Checkbox
                            id="is_insured"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                        )}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="is_insured" className="text-sm font-bold cursor-pointer">Secured Shipment</Label>
                        <p className="text-[10px] text-muted-foreground font-semibold">Protect against damage/loss</p>
                      </div>
                    </div>
                  </>)}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-bold shadow-sm"
                  disabled={isLoading || !canCalculate}
                >
                  {isLoading ? (
                    <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <HugeiconsIcon icon={FlashIcon} className="mr-2 h-4 w-4" />
                  )}
                  Calculate Rates
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Real-time Summary Card */}
          <Card className="bg-primary/5 border-primary/10 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Weight Summary</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Volumetric Weight</span>
                  <span className="text-sm font-bold">{(volumetricWeight * 1000).toFixed(0)} g</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Actual Weight</span>
                  <span className="text-sm font-bold">{formValues.actualWeight || 0} g</span>
                </div>
                <Separator className="bg-primary/10" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Chargeable Weight</span>
                  <span className="text-lg font-black text-primary">{(Math.max(volumetricWeight * 1000, formValues.actualWeight || 0)).toFixed(0)} g</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="w-full lg:col-span-8 space-y-6">
          {showRates ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">

              {/* Active Route Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <HugeiconsIcon icon={Location01Icon} className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Origin</p>
                    <p className="font-bold">{data?.pickup_location?.city || formValues.pickupPincode}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <HugeiconsIcon icon={Navigation01Icon} className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Destination</p>
                    <p className="font-bold">{data?.delivery_location?.city || formValues.deliveryPincode}</p>
                  </div>
                </div>
              </div>

              {/* Filters & Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold tracking-tight">
                  Available Partners <span className="text-muted-foreground ml-1 font-normal text-base">({filteredPartners.length})</span>
                </h2>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                  <TabsList className="grid grid-cols-3 w-full sm:w-[300px]">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="air">Air</TabsTrigger>
                    <TabsTrigger value="surface">Surface</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Courier List */}
              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-6"><Skeleton className="h-20 w-full" /></Card>
                  ))
                ) : isError ? (
                  <Card className="p-12 text-center border-dashed">
                    <HugeiconsIcon icon={Cancel01Icon} className="h-12 w-12 text-destructive mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold">Calculation Failed</h3>
                    <p className="text-muted-foreground mt-1">We couldn&apos;t fetch rates right now. Please try again.</p>
                    <Button onClick={() => refetch()} variant="outline" className="mt-6">Retry Connection</Button>
                  </Card>
                ) : filteredPartners.length === 0 ? (
                  <Card className="p-12 text-center border-dashed">
                    <HugeiconsIcon icon={Search01Icon} className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold">No Routes Found</h3>
                    <p className="text-muted-foreground mt-1">Try adjusting your pincodes or weight parameters.</p>
                  </Card>
                ) : (
                  filteredPartners.map((courier) => (
                    <CourierCard
                      key={courier.courier_company_id}
                      courier={courier}
                      onShipNow={handleShipNow}
                    />
                  ))
                )}
              </div>

              {/* T&C Section */}
              <CalculationGuidelines />
            </div>
          ) : (
            <div className="h-full min-h-[500px] border-2 border-dashed rounded-3xl bg-muted/20 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-1000">
              <div className="bg-background p-6 rounded-2xl shadow-sm border mb-6">
                <HugeiconsIcon icon={AiCloudIcon} className="h-12 w-12 text-primary opacity-40" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Ready to Calculate</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Enter your shipment details on the left to see instant rates from our courier partners.
              </p>
              <div className="flex gap-2 mt-8">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-bounce [animation-delay:0.2s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
