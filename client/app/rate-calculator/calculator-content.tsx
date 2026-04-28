"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PackageSearch01Icon,
  InformationCircleIcon,
  Location01Icon,
  FlashIcon,
  RotateLeft01Icon,
  StarIcon,
  TruckIcon,
  Loading03Icon,
  Navigation01Icon,
  Search01Icon,
  RocketIcon,
  Cancel01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  CallIcon
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { CourierCard, CalculationGuidelines } from "@/components/calculator-components";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const rateCalculatorSchema = z.object({
  pickupPincode: z.string().min(6, "Pickup pincode is required"),
  deliveryPincode: z.string().min(6, "Delivery pincode is required"),
  actualWeight: z.number().min(100, "Weight must be at least 100g").max(1000000, "Weight cannot exceed 1000kg"),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  paymentType: z.enum(["PREPAID", "COD"]),
  shipmentValue: z.number().optional(),
  dangerousGoods: z.boolean().optional(),
});

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
  courier_logo_url?: string;
}

interface RateResponse {
  pickup_location: LocationInfo;
  delivery_location: LocationInfo;
  shipment_info: ShipmentInfo;
  serviceable_couriers: CourierPartner[];
}

interface PincodeDetails {
  success: boolean;
  postcode_details?: {
    city: string;
    state: string;
    postcode: string;
  };
}

export function CalculatorContent() {
  const [showRates, setShowRates] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();
  const [pickupLocality, setPickupLocality] = useState<PincodeDetails | null>(null);
  const [deliveryLocality, setDeliveryLocality] = useState<PincodeDetails | null>(null);
  const [loadingPickup, setLoadingPickup] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [ratesData, setRatesData] = useState<RateResponse | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState(false);

  const rateCalculatorSchemaLocal = rateCalculatorSchema;

  type RateCalculatorFormData = z.output<typeof rateCalculatorSchemaLocal>;

  const form = useForm<RateCalculatorFormData>({
    resolver: zodResolver(rateCalculatorSchemaLocal),
    defaultValues: {
      pickupPincode: "",
      deliveryPincode: "",
      actualWeight: 500,
      length: 0,
      width: 0,
      height: 0,
      paymentType: "PREPAID",
      shipmentValue: 500,
      dangerousGoods: false,
    },
  });

  const { errors } = form.formState;
  const formValues = form.watch();

  const fetchPincodeDetails = useCallback(async (pincode: string, type: "pickup" | "delivery") => {
    if (pincode.length !== 6) return;

    if (type === "pickup") {
      setLoadingPickup(true);
    } else {
      setLoadingDelivery(true);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/public/pincode-details?postcode=${pincode}`
      );
      const data = await response.json();

      if (type === "pickup") {
        setPickupLocality(data);
      } else {
        setDeliveryLocality(data);
      }
    } catch (error) {
      console.error("Error fetching pincode details:", error);
      if (type === "pickup") {
        setPickupLocality({ success: false });
      } else {
        setDeliveryLocality({ success: false });
      }
    } finally {
      if (type === "pickup") {
        setLoadingPickup(false);
      } else {
        setLoadingDelivery(false);
      }
    }
  }, []);

  const handlePickupPincodeChange = (value: string) => {
    form.setValue("pickupPincode", value);
    if (value.length === 6) {
      fetchPincodeDetails(value, "pickup");
    } else {
      setPickupLocality(null);
    }
  };

  const handleDeliveryPincodeChange = (value: string) => {
    form.setValue("deliveryPincode", value);
    if (value.length === 6) {
      fetchPincodeDetails(value, "delivery");
    } else {
      setDeliveryLocality(null);
    }
  };

  const volumetricWeight = useMemo(() => {
    const l = Number(formValues.length) || 0;
    const w = Number(formValues.width) || 0;
    const h = Number(formValues.height) || 0;
    return (l * w * h) / 5000;
  }, [formValues.length, formValues.width, formValues.height]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await form.trigger();
    if (!isValid) return;

    setShowRates(true);
    setLoadingRates(true);
    setRatesError(false);

    try {
      const params = new URLSearchParams({
        pickup_postcode: formValues.pickupPincode,
        delivery_postcode: formValues.deliveryPincode,
        weight: ((formValues.actualWeight || 500) / 1000).toString(),
        cod: formValues.paymentType === "COD" ? "1" : "0",
        declared_value: (formValues.shipmentValue || 500).toString(),
        length: (formValues.length || "").toString(),
        breadth: (formValues.width || "").toString(),
        height: (formValues.height || "").toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/v1/public/calculate-rates?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch rates");
      }

      const data = await response.json();
      setRatesData(data);
    } catch (error) {
      console.error("Error calculating rates:", error);
      setRatesError(true);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleReset = () => {
    setShowRates(false);
    setPickupLocality(null);
    setDeliveryLocality(null);
    setRatesData(null);
    form.reset({
      pickupPincode: "",
      deliveryPincode: "",
      actualWeight: 500,
      length: 0,
      width: 0,
      height: 0,
      paymentType: "PREPAID",
      shipmentValue: 500,
      dangerousGoods: false,
    });
  };

  const handleShipNow = () => {
    router.push("/auth/signup");
  };

  const partners = ratesData?.serviceable_couriers ?? [];
  const filteredPartners = partners
    .sort((a, b) => a.rate - b.rate)
    .filter(p => {
      if (activeTab === "all") return true;
      return p.mode.toLowerCase() === activeTab.toLowerCase();
    });

  const isPickupValid = pickupLocality && (pickupLocality?.success !== false) && (pickupLocality?.postcode_details);
  const isDeliveryValid = deliveryLocality && (deliveryLocality?.success !== false) && (deliveryLocality?.postcode_details);

  const MAX_WEIGHT_KG = 1000;
  const MAX_AMOUNT = 475000;
  const weightInKg = ((formValues.actualWeight || 500) || 0) / 1000;
  const isWeightValid = weightInKg <= MAX_WEIGHT_KG;
  const isAmountValid = ((formValues.shipmentValue || 500) || 0) <= MAX_AMOUNT;
  const canCalculate = isPickupValid && isDeliveryValid && isWeightValid && isAmountValid;

  const getWeightError = () => {
    if (formValues.actualWeight && !isWeightValid) {
      return `Maximum weight is ${MAX_WEIGHT_KG}kg. Please reduce your weight.`;
    }
    return null;
  };

  const getAmountError = () => {
    if (formValues.shipmentValue && !isAmountValid) {
      return `Maximum declared value is ₹${MAX_AMOUNT.toLocaleString('en-IN')}. Please reduce your shipment value.`;
    }
    return null;
  };

  return (
    <div className=" mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-700 pb-32">
      {/* <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
          Rate Calculator
        </h1>
      </div> */}

      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-10 items-start",
        showRates && "flex flex-col-reverse lg:grid"
      )}>

        <div className="w-full lg:col-span-4 space-y-8  bg-transparent border-0 shadow-none max-w-md">
          <Card className=" bg-transparent border-0 shadow-none ring-0" >
            <CardHeader className="space-y-1.5 px-6 pt-6  bg-transparent border-0 shadow-none">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Check Rates</CardTitle>
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
                        onChange={(e) => handlePickupPincodeChange(e.target.value)}
                      />
                      {loadingPickup ? (
                        <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">Verifying...</p>
                      ) : isPickupValid ? (
                        <p className="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-tight">
                          {pickupLocality?.postcode_details?.city}, {pickupLocality?.postcode_details?.state}
                        </p>
                      ) : formValues.pickupPincode?.length === 6 && !loadingPickup && (
                        <p className="text-[10px] text-destructive font-bold mt-1 uppercase tracking-tight">Invalid Pincode</p>
                      )}
                      <FieldError errors={[errors.pickupPincode]} />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Pincode</FieldLabel>
                      <Input
                        {...form.register("deliveryPincode")}
                        placeholder="000000"
                        className={cn("font-medium", !isDeliveryValid && formValues.deliveryPincode?.length === 6 && "border-destructive")}
                        onChange={(e) => handleDeliveryPincodeChange(e.target.value)}
                      />
                      {loadingDelivery ? (
                        <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">Verifying...</p>
                      ) : isDeliveryValid ? (
                        <p className="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-tight">
                          {deliveryLocality?.postcode_details?.city}, {deliveryLocality?.postcode_details?.state}
                        </p>
                      ) : formValues.deliveryPincode?.length === 6 && !loadingDelivery && (
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
                        className={cn("font-medium", !isWeightValid && formValues.actualWeight && "border-destructive")}
                      />
                      {!isWeightValid && formValues.actualWeight && (
                        <p className="text-[10px] text-destructive font-bold mt-1">{getWeightError()}</p>
                      )}
                      <FieldError errors={[errors.actualWeight]} />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value (₹)</FieldLabel>
                      <Input
                        {...form.register("shipmentValue", { valueAsNumber: true })}
                        placeholder="500"
                        className={cn("font-medium", !isAmountValid && formValues.shipmentValue && "border-destructive")}
                      />
                      {!isAmountValid && formValues.shipmentValue && (
                        <p className="text-[10px] text-destructive font-bold mt-1">{getAmountError()}</p>
                      )}
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
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-bold shadow-sm"
                  disabled={loadingRates || !canCalculate}
                >
                  {loadingRates ? (
                    <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <HugeiconsIcon icon={FlashIcon} className="mr-2 h-4 w-4" />
                  )}
                  Calculate Rates
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* <Card className="bg-primary/5 border-primary/10 shadow-none">
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
                  <span className="text-sm font-bold">{(formValues.actualWeight || 500) || 0} g</span>
                </div>
                <Separator className="bg-primary/10" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Chargeable Weight</span>
                  <span className="text-lg font-black text-primary">{(Math.max(volumetricWeight * 1000, (formValues.actualWeight || 500) || 0)).toFixed(0)} g</span>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        <div className="w-full lg:col-span-8 space-y-6">
          {showRates ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <HugeiconsIcon icon={Location01Icon} className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Origin</p>
                    <p className="font-bold">{ratesData?.pickup_location?.city || formValues.pickupPincode} ({formValues.pickupPincode})</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <HugeiconsIcon icon={Navigation01Icon} className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Destination</p>
                    <p className="font-bold">{ratesData?.delivery_location?.city || formValues.deliveryPincode} ({formValues.deliveryPincode})</p>
                  </div>
                </div>
              </div>

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

              <div className="space-y-4">
                {loadingRates ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-6"><Skeleton className="h-20 w-full" /></Card>
                  ))
                ) : ratesError ? (
                  <Card className="p-12 text-center border-dashed">
                    <HugeiconsIcon icon={Cancel01Icon} className="h-12 w-12 text-destructive mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold">Calculation Failed</h3>
                    <p className="text-muted-foreground mt-1">We couldn&apos;t fetch rates right now. Please try again.</p>
                    <Button onClick={handleCalculate} variant="outline" className="mt-6">Retry Connection</Button>
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

              <CalculationGuidelines />
            </div>
          ) : (
            <section className="relative pb-15  w-full h-full ">
              <div className="container mx-auto px-4 relative">

                <form className="max-w-md mx-auto" action="/track" method="get">
                  <label
                    htmlFor="search"
                    className="block mb-2.5 text-sm font-medium text-heading sr-only"
                  >
                    Search
                  </label>

                  <div className="relative ">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none ">
                      <svg
                        className="w-4 h-4 text-body"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="2"
                          d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                        />
                      </svg>
                    </div>

                    <input
                      type="text"
                      name="awb"
                      id="search-by-awb"

                      className="block w-full p-3 ps-9 border mb-9 rounded-2xl bg-background"
                      placeholder="Search by AWB"
                      required
                    />

                    <Button

                      variant="ghost"
                      type="submit"
                      className="absolute end-1.5 bottom-1.5 rounded-2xl  border border-muted shadow-xs p-4"
                    >
                      <HugeiconsIcon icon={PackageSearch01Icon} size={18} />
                    </Button>
                  </div>
                </form>

                <div className="max-w-3xl mx-auto text-center">
                  <Badge variant="secondary" className="mb-6">
                    <HugeiconsIcon icon={FlashIcon} className="w-3 h-3 mr-1" />
                    Now serving 27,000+ pin codes
                  </Badge>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                    Ship Smarter,
                    <span className="text-primary"> Save Bigger</span>
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    Compare shipping rates from 25+ carriers in seconds. Save up to 40% on every shipment with India&apos;s smartest logistics platform.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/dashboard">
                      <Button size="lg" className="h-12 px-8">
                        Start Shipping Free
                        <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2" size={18} />
                      </Button>
                    </Link>
                    <Link href="/rate-calculator">
                      <Button size="lg" variant="outline" className="h-12 px-8">
                        Compare Rates Now
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-500" />
                      No credit card required
                    </span>
                    <span className="flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-500" />
                      Free forever plan
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 flex md:hidden mt-5">
                    <a href="tel:+919509698208" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <HugeiconsIcon icon={CallIcon} size={14} className="text-green-500" />
                      <span className="">9509698208</span>
                    </a>
                    <span className="text-muted-foreground/30">|</span>
                    <a href="tel:+919251220521" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <span className="">9251220521</span>
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}