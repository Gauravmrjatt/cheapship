"use client";
import React, { Fragment } from "react";
import confetti from "canvas-confetti";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { createOrderSchema, shiprocketPickupSchema } from "@/lib/validators/order";
import { useRouter, useSearchParams } from "next/navigation";
import { sileo } from "sileo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select";
import { useHttp } from "@/lib/hooks/use-http";
import { useCheckPhoneVerificationMutation } from "@/lib/hooks/use-orders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Package01Icon,
  ShippingTruck01Icon,
  Add01Icon,
  SearchIcon,
  CreditCardIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Wallet01Icon,
  AddressBookIcon,
  Location01Icon,
  StarIcon,
  TruckIcon,
  RocketIcon,
  Navigation01Icon,
  Delete01Icon,
  CheckmarkBadge01Icon,
  Loading03Icon,
  Shield01Icon,
  Configuration02Icon,
  ViewIcon,
  UserCircle02Icon,
  Mail01Icon,
  SmartPhone01Icon,
  UserGroupIcon,
  LocationAdd01Icon,
  AccountSetting03Icon,
  MapsCircle01Icon,
  DocumentValidationIcon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useRateCalculatorStore } from "@/lib/store/rate-calculator";

const PRODUCT_SUGGESTIONS = [
  "Cotton Shirt", "Denim Jeans", "Silk Saree", "T-Shirt", "Kurta",
  "Electronics Item", "Mobile Phone", "Books", "Cosmetics", "Footwear",
  "Handbag", "Watch", "Sunglasses", "Jewelry", "Home Decor",
  "Kitchen Items", "Sports Equipment", "Toys", "Stationery", "Medicines"
];

const formatPrice = (price: number | string) => {
  return parseFloat(String(price)).toFixed(2);
};

const steps = [
  { id: 1, title: "Package", icon: Package01Icon, description: "Content & Size" },
  { id: 2, title: "Courier", icon: TruckIcon, description: "Choose Service" },
  { id: 3, title: "Shipping", icon: Navigation01Icon, description: "Pickup & Drop" },
  { id: 4, title: "Confirm", icon: CheckmarkCircle01Icon, description: "Review Order" },
];

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  email?: string;
  complete_address: string;
  city: string;
  state: string;
  pincode: string;
  address_label?: string;
  is_default: boolean;
}

interface ShiprocketPickupLocation {
  pickup_location: string;
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string | number;
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
}

interface RateResponse {
  pickup_location: { city: string; state: string; postcode: string };
  delivery_location: { city: string; state: string; postcode: string };
  serviceable_couriers: CourierPartner[];
}

interface PreSelectedCourier {
  courier_company_id: number;
  courier_name: string;
  rate: number;
}

interface CreateOrderContentProps {
  preSelectedCourier?: PreSelectedCourier | null;
}

export default function CreateOrderContent({ preSelectedCourier }: CreateOrderContentProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isShipped, setShipped] = useState(false);
  const [openAddPickupSheet, setOpenAddPickupSheet] = useState(false);
  const [openOtpDialog, setOpenOtpDialog] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showLoadDraftDialog, setShowLoadDraftDialog] = useState(false);
  const [draftToLoad, setDraftToLoad] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");
  const http = useHttp();
  const queryClient = useQueryClient();
  const { data: rateCalculatorData, clearRateData } = useRateCalculatorStore();

  const pickupForm = useForm<z.infer<typeof shiprocketPickupSchema>>({
    resolver: zodResolver(shiprocketPickupSchema),
    defaultValues: {
      pickup_location: "", name: "", phone: "", email: "", pin_code: "",
      address: "", city: "", state: "", country: "India",
    },
    mode: "onChange",
  });

  const { mutate: saveAddressMutation } = useMutation(
    http.post("/addresses", {
      onSuccess: () => {
        sileo.success({ title: "Success", description: "Address saved to address book" });
        queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      },
    })
  );

  const { mutate: saveShiprocketPickupMutation, isPending: isSavingShiprocketPickup } = useMutation(
    http.post("/addresses/pickup", {
      onSuccess: (data: any) => {
        if (data.success) {
          sileo.success({ title: "Success", description: "Pickup location created" });
          queryClient.invalidateQueries({ queryKey: ["shiprocket-pickup-locations"] });
          setOpenAddPickupSheet(false);
          pickupForm.reset();
        } else {
          const errorMsg = data.message || "Failed to create pickup location";
          sileo.error({ title: "Error", description: errorMsg });
        }
      },
    })
  );

  const { mutate: sendOtpMutation, isPending: isSendingOtp } = useMutation(http.post("/addresses/verify-phone"));
  const { mutate: checkPhoneVerificationMutation, isPending: isCheckingPhone } = useCheckPhoneVerificationMutation();
  const { mutate: verifyOtpMutation, isPending: isVerifyingOtp } = useMutation(
    http.post("/addresses/verify-otp", {
      onSuccess: (data: any) => {
        if (data.success) {
          setOpenOtpDialog(false);
          setOtp("");
          if (pendingOrderData) createOrderMutation(pendingOrderData);
        }
      },
    })
  );

  const { mutate: createOrderMutation, isPending: isCreatingOrder } = useMutation(
    http.post("/orders", {
      onSuccess: (data: any) => {
        if (isSavingDraft) {
          setIsSavingDraft(false);
          sileo.success({ title: "Draft Saved", description: "Your order has been saved as a draft" });
          return;
        }
        setCreatedOrderId(data.id?.toString() || null);
        setShipped(true);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

        // Auto-save addresses if the user wants to or if it's default behavior
        if (formValues.save_pickup_address || true) { // Always save for now as requested by user
          saveAddressMutation({
            ...formValues.pickup_address,
            complete_address: formValues.pickup_address.address,
            address_label: "Sender - Auto-Saved"
          } as any);
        }

        if (formValues.save_receiver_address || true) { // Always save for now as requested by user
          saveAddressMutation({
            ...formValues.receiver_address,
            complete_address: formValues.receiver_address.address,
            address_label: "Receiver - Auto-Saved"
          } as any);
        }
      },
    })
  );

  const isSubmitting = isCheckingPhone || isCreatingOrder || isSendingOtp;
  const submissionStatus = isCheckingPhone ? "Verifying Phone..." : isSendingOtp ? "Sending OTP..." : isSavingDraft ? "Saving Draft..." : isCreatingOrder ? "Creating Order..." : "Processing...";

  const form = useForm<z.infer<typeof createOrderSchema>>({
    resolver: zodResolver(createOrderSchema) as any,
    defaultValues: {
      order_type: "SURFACE", shipment_type: "DOMESTIC", payment_mode: "PREPAID",
      total_amount: 0, cod_amount: 0, weight: 0.5, length: 1, width: 1, height: 1,
      pickup_location: "",
      pickup_address: { name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", },
      receiver_address: { name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", },
      products: [{ name: "", quantity: 1, price: 0 }],
      save_pickup_address: false, save_receiver_address: false,
      make_pickup_address: false, same_as_pickup: false,
    },
    mode: "onChange",
  });

  const { errors } = form.formState;
  const formValues = form.watch();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "products" });

  useEffect(() => {
    const productsTotal = formValues.products?.reduce((sum: number, p: any) => sum + ((p.quantity || 0) * (p.price || 0)), 0) || 0;
    if (productsTotal !== formValues.total_amount) {
      form.setValue("total_amount", productsTotal, { shouldValidate: false });
    }
  }, [formValues.products, form.setValue]);

  useEffect(() => {
    if (rateCalculatorData) {
      form.reset({
        ...formValues,
        order_type: rateCalculatorData.order_type,
        payment_mode: rateCalculatorData.paymentType,
        total_amount: rateCalculatorData.shipmentValue,
        weight: rateCalculatorData.weight,
        length: rateCalculatorData.length, width: rateCalculatorData.width, height: rateCalculatorData.height,
        pickup_address: { ...formValues.pickup_address, pincode: rateCalculatorData.pickupPincode },
        receiver_address: { ...formValues.receiver_address, pincode: rateCalculatorData.deliveryPincode },
        products: [{ name: "", quantity: 1, price: rateCalculatorData.shipmentValue }],
        courier_id: rateCalculatorData.selectedCourier?.courier_company_id,
        courier_name: rateCalculatorData.selectedCourier?.courier_name,
        shipping_charge: rateCalculatorData.selectedCourier?.rate,
      });
      // Skip the Package step (Step 1) only if no pre-selected courier from URL params
      if (!preSelectedCourier) {
        setCurrentStep(2);
      }
      clearRateData();
    }
  }, [rateCalculatorData, clearRateData, form, formValues, preSelectedCourier]);

  useEffect(() => {
    if (preSelectedCourier) {
      form.setValue("courier_id", preSelectedCourier.courier_company_id);
      form.setValue("courier_name", preSelectedCourier.courier_name);
      form.setValue("shipping_charge", preSelectedCourier.rate);
      form.setValue("total_amount", preSelectedCourier.rate);
    }
  }, [preSelectedCourier, form]);

  const { data: savedAddresses, isLoading: isLoadingSavedAddr } = useQuery<SavedAddress[]>(
    http.get(["saved-addresses"], "/addresses", true)
  );

  const { data: shiprocketPickups, isLoading: isLoadingPickups } = useQuery<any>(
    http.get(["shiprocket-pickup-locations"], "/addresses/pickup", true)
  );

  const shiprocketPickupLocations = shiprocketPickups?.data?.shipping_address || [];

  const { data: recentProductsData } = useQuery<string[]>({
    queryKey: ['recent-products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/orders?pageSize=20', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const products = new Set<string>();
      data.data?.forEach((order: any) => {
        order.products?.forEach((p: any) => { if (p.name) products.add(p.name); });
      });
      return Array.from(products);
    },
  });

  const { data: draftData, isLoading: isLoadingDraft } = useQuery<any>(
    http.get(["order-draft", draftId], `/orders/${draftId}`, !!draftId)
  );

  useEffect(() => {
    if (draftData && draftData.is_draft && !showLoadDraftDialog && !draftToLoad) {
      setDraftToLoad(draftData);
      setShowLoadDraftDialog(true);
    }
  }, [draftData, showLoadDraftDialog, draftToLoad]);

  const handleLoadDraft = (refreshRates: boolean) => {
    const data = draftToLoad;
    form.reset({
      ...form.getValues(),
      order_type: data.order_type,
      shipment_type: data.shipment_type,
      payment_mode: data.payment_mode,
      total_amount: Number(data.total_amount),
      cod_amount: Number(data.cod_amount || 0),
      weight: Number(data.weight),
      length: Number(data.length),
      width: Number(data.width),
      height: Number(data.height),
      pickup_location: data.pickup_location || "",
      pickup_address: {
        name: data.order_pickup_address?.name || "",
        phone: data.order_pickup_address?.phone || "",
        email: data.order_pickup_address?.email || "",
        address: data.order_pickup_address?.address || "",
        city: data.order_pickup_address?.city || "",
        state: data.order_pickup_address?.state || "",
        pincode: data.order_pickup_address?.pincode || "",
      },
      receiver_address: {
        name: data.order_receiver_address?.name || "",
        phone: data.order_receiver_address?.phone || "",
        email: data.order_receiver_address?.email || "",
        address: data.order_receiver_address?.address || "",
        city: data.order_receiver_address?.city || "",
        state: data.order_receiver_address?.state || "",
        pincode: data.order_receiver_address?.pincode || "",
      },
      products: data.products || [{ name: "", quantity: 1, price: 0 }],
      courier_id: refreshRates ? undefined : data.courier_id,
    });
    setCurrentStep(refreshRates ? 2 : 4);
    setShowLoadDraftDialog(false);
    setDraftToLoad(null);
  };

  const allProductSuggestions = [...new Set([...PRODUCT_SUGGESTIONS, ...(recentProductsData || [])])];

  const { data: pickupLocality, isLoading: isLoadingPickup } = useQuery<any>(
    http.get(["pincode-details", formValues.pickup_address.pincode], `/orders/pincode-details?postcode=${formValues.pickup_address.pincode}`, formValues.pickup_address.pincode?.length === 6, {
      onSuccess: (data: any) => {
        if (data.success || !!data.postcode_details) {
          form.setValue("pickup_address.city", data.postcode_details.city);
          form.setValue("pickup_address.state", data.postcode_details.state);
        }
      }
    })
  );

  const { data: deliveryLocality, isLoading: isLoadingDelivery } = useQuery<any>(
    http.get(["pincode-details", formValues.receiver_address.pincode], `/orders/pincode-details?postcode=${formValues.receiver_address.pincode}`, formValues.receiver_address.pincode?.length === 6, {
      onSuccess: (data: any) => {
        if (data.success || !!data.postcode_details) {
          form.setValue("receiver_address.city", data.postcode_details.city);
          form.setValue("receiver_address.state", data.postcode_details.state);
        }
      }
    })
  );

  const sheetPincode = pickupForm.watch("pin_code");
  const { data: sheetPincodeData, isLoading: isLoadingSheetPincode } = useQuery<any>(
    http.get(["pincode-details-sheet", sheetPincode], `/orders/pincode-details?postcode=${sheetPincode}`, sheetPincode?.length === 6, {
      onSuccess: (data: any) => {
        if (data?.postcode_details && data.success) {
          pickupForm.setValue("city", data.postcode_details.city);
          pickupForm.setValue("state", data.postcode_details.state);
        } else {
          pickupForm.setValue("city", "");
          pickupForm.setValue("state", "");
        }
      }
    })
  );

  const isPickupPincodeValid = pickupLocality?.success || !!pickupLocality?.postcode_details;
  const isDeliveryPincodeValid = deliveryLocality?.success || !!deliveryLocality?.postcode_details;

  const courierParams = useMemo(() => new URLSearchParams({
    pickup_postcode: formValues.pickup_address.pincode,
    delivery_postcode: formValues.receiver_address.pincode,
    weight: formValues.weight?.toString() || "0.5",
    cod: formValues.payment_mode === "COD" ? "1" : "0",
    declared_value: formValues.total_amount?.toString() || "0",
    length: formValues.length?.toString() || "10",
    breadth: formValues.width?.toString() || "10",
    height: formValues.height?.toString() || "10",
    mode: formValues.order_type === "CARGO" ? "Cargo" : formValues.order_type === "SURFACE" ? "Surface" : "Air"
  }).toString(), [formValues]);

  const { data: rateData, isLoading: isLoadingRates, refetch: refetchRates, isRefetching } = useQuery<RateResponse>(
    http.get(["order-rates", courierParams], `/orders/calculate-rates?${courierParams}`, currentStep === 2 && formValues.pickup_address.pincode.length === 6 && formValues.receiver_address.pincode.length === 6)
  );

  // Store previous value to detect receiver pincode change
  const prevReceiverPincode = React.useRef(formValues.receiver_address.pincode);
  const isInitialMount = React.useRef(true);

  // Handle receiver pincode changes only
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Check if user already on step 2 or 3
    if (currentStep < 2) return;

    const receiverPincodeChanged = prevReceiverPincode.current &&
      formValues.receiver_address.pincode !== prevReceiverPincode.current &&
      formValues.receiver_address.pincode?.length === 6;

    if (receiverPincodeChanged) {
      // Clear selected courier
      form.setValue("courier_id", undefined);
      form.setValue("courier_name", "");
      form.setValue("shipping_charge", 0);
      form.setValue("total_amount", 0);

      // Show message for receiver pincode change
      sileo.info({
        title: "Receiver Pincode Changed",
        description: "Receiver pincode changed. Please select a new courier partner."
      });

      // Move to step 2 for courier selection
      setCurrentStep(2);

      // Refetch rates if pincodes are valid
      if (formValues.pickup_address.pincode.length === 6 && formValues.receiver_address.pincode.length === 6) {
        refetchRates();
      }
    }

    // Update ref
    if (formValues.receiver_address.pincode) prevReceiverPincode.current = formValues.receiver_address.pincode;
  }, [formValues.receiver_address.pincode, currentStep, form, setCurrentStep, refetchRates]);

  // Store previously selected courier to check availability after rates change
  const prevSelectedCourierId = React.useRef<number | undefined>(formValues.courier_id);
  const prevSelectedCourierName = React.useRef<string>(formValues.courier_name);

  // Check if selected courier is still available when rates change
  useEffect(() => {
    if (rateData && formValues.courier_id && currentStep >= 2) {
      const availableCouriers = rateData.serviceable_couriers || [];
      const isCourierAvailable = availableCouriers.some((c: any) => c.courier_company_id === formValues.courier_id);

      // If previously had a courier selected but it's no longer available
      if (prevSelectedCourierId.current && !isCourierAvailable) {
        form.setValue("courier_id", undefined);
        form.setValue("courier_name", "");
        form.setValue("shipping_charge", 0);
        form.setValue("total_amount", 0);
        sileo.info({
          title: "Courier Unavailable",
          description: `${prevSelectedCourierName.current} is not available for this route. Please select a new courier.`
        });
      }
      // Update the prev ref
      prevSelectedCourierId.current = formValues.courier_id;
      prevSelectedCourierName.current = formValues.courier_name;
    }
  }, [rateData, formValues.courier_id, currentStep, form]);

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    if (!isValid) {
      sileo.error({
        title: "Validation Error",
        description: "Please fill all mandatory fields correctly before continuing."
      });
      return;
    }
    if (currentStep === 2 && !formValues.courier_id) {
      sileo.error({
        title: "Courier Required",
        description: "Please select a courier partner to continue."
      });
      return;
    }
    if (currentStep === 3 && !formValues.pickup_location) {
      sileo.error({
        title: "Pickup Address Required",
        description: "Please select a pickup location to continue."
      });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1: return ["order_type", "payment_mode", "weight", "length", "width", "height", "products", "pickup_address.pincode", "receiver_address.pincode"];
      case 2: return ["courier_id"];
      case 3: return ["pickup_location", "pickup_address", "receiver_address"];
      default: return [];
    }
  };

  function onSubmit(values: z.infer<typeof createOrderSchema>) {
    const { shipping_charge, base_shipping_charge, courier_name, ...orderData } = values;
    checkPhoneVerificationMutation(values.pickup_address.phone, {
      onSuccess: (data: any) => {
        if (data.success && data.verified) createOrderMutation(orderData as any);
        else { setPendingOrderData(orderData); sendOtpMutation({ phone: values.pickup_address.phone }, { onSuccess: () => setOpenOtpDialog(true) } as any); }
      },
    } as any);
  }

  const handleVerifyOtp = () => {
    if (!otp || otp.length < 4) return sileo.error({ title: "Error", description: "Invalid OTP" });
    verifyOtpMutation({ otp, number: formValues.pickup_address.phone } as any);
  };

  const handleResendOtp = () => sendOtpMutation({ phone: formValues.pickup_address.phone } as any);

  const selectSavedAddress = (address: SavedAddress, prefix: "pickup_address" | "receiver_address") => {
    form.setValue(`${prefix}.name`, address.name, { shouldValidate: true });
    form.setValue(`${prefix}.phone`, address.phone, { shouldValidate: true });
    form.setValue(`${prefix}.email`, address.email || "", { shouldValidate: true });
    form.setValue(`${prefix}.pincode`, address.pincode, { shouldValidate: true });
    form.setValue(`${prefix}.address`, address.complete_address, { shouldValidate: true });
    form.setValue(`${prefix}.city`, address.city, { shouldValidate: true });
    form.setValue(`${prefix}.state`, address.state, { shouldValidate: true });
  };

  const selectShiprocketPickup = (addr: ShiprocketPickupLocation) => {
    // Only fill sender details if "Same as pickup" is checked
    if (formValues.same_as_pickup) {
      form.setValue("pickup_address.name", addr.name, { shouldValidate: true });
      form.setValue("pickup_address.phone", addr.phone, { shouldValidate: true });
      form.setValue("pickup_address.email", addr.email || "", { shouldValidate: true });
      form.setValue("pickup_address.pincode", addr.pin_code.toString(), { shouldValidate: true });
      form.setValue("pickup_address.address", addr.address, { shouldValidate: true });
      form.setValue("pickup_address.city", addr.city, { shouldValidate: true });
      form.setValue("pickup_address.state", addr.state, { shouldValidate: true });
    }
    // Keep receiver as-is - it comes from Step 1 delivery pincode
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-500 pb-32">
      {/* Stepper */}
      <div className="relative border rounded-xl bg-card p-6 shadow-sm overflow-hidden">
        <div className="absolute top-11 left-12 right-12 h-0.5 bg-muted " />
        <div
          className="absolute -top-12 left-12 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 24px)` }}
        />

        <div className="relative flex justify-between z-10">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-3 w-20">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-all duration-300",
                currentStep === s.id ? "border-primary text-primary ring-4 ring-primary/10" :
                  currentStep > s.id ? "bg-primary border-primary text-primary-foreground" : "border-muted text-muted-foreground"
              )}>
                {currentStep > s.id ? <HugeiconsIcon icon={DocumentValidationIcon} size={18} /> : <HugeiconsIcon icon={s.icon} size={18} />}
              </div>
              <div className="text-center">
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", currentStep === s.id ? "text-foreground" : "text-muted-foreground")}>{s.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Content */}
      <LazyMotion features={domAnimation}>
        <AnimatePresence mode="wait">
          <m.div
            key={currentStep}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={form.handleSubmit(
              onSubmit as any,
              (errors) => {
                console.log("Validation Errors:", errors);
              }
            )} className="space-y-8">
              {currentStep === 1 && <StepOne form={form} fields={fields} append={append} remove={remove} allSuggestions={allProductSuggestions} formValues={formValues} isLoadingPickup={isLoadingPickup} isPickupValid={isPickupPincodeValid} pickupLocality={pickupLocality} isLoadingDelivery={isLoadingDelivery} isDeliveryValid={isDeliveryPincodeValid} deliveryLocality={deliveryLocality} shiprocketPickups={shiprocketPickupLocations} setOpenAddPickupSheet={setOpenAddPickupSheet} selectShiprocketPickup={selectShiprocketPickup} />}
              {currentStep === 2 && <StepThree form={form} rateData={rateData} isLoadingRates={isLoadingRates} formValues={formValues} refetchRates={refetchRates} />}
              {currentStep === 3 && <StepTwo form={form} shiprocketPickups={shiprocketPickupLocations} savedAddresses={savedAddresses} selectSavedAddress={selectSavedAddress} selectShiprocketPickup={selectShiprocketPickup} formValues={formValues} isLoadingPickup={isLoadingPickup} isPickupValid={isPickupPincodeValid} pickupLocality={pickupLocality} isLoadingDelivery={isLoadingDelivery} isDeliveryValid={isDeliveryPincodeValid} deliveryLocality={deliveryLocality} setOpenAddPickupSheet={setOpenAddPickupSheet} />}
              {currentStep === 4 && <StepFour formValues={formValues} shiprocketPickups={shiprocketPickupLocations} isShipped={isShipped} createdOrderId={createdOrderId} isCreatingOrder={isCreatingOrder} router={router} http={http} />}

              {/* Navigation Buttons */}
              {!isShipped && (
                <div className="flex items-center justify-between border-t pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isCreatingOrder}
                    className={cn("gap-2 px-6 rounded-lg", currentStep === 1 && "invisible")}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
                    Back
                  </Button>

                  {currentStep < steps.length ? (
                    <Button
                      type="button"
                      className="gap-2 px-8  shadow-sm"
                      onClick={nextStep}
                    >
                      Continue
                      <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                    </Button>
                  ) : (
                    <div className="flex gap-4">
                      {/* <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const values = form.getValues();
                          const { shipping_charge, base_shipping_charge, courier_name, ...orderData } = values;
                          setIsSavingDraft(true);
                          createOrderMutation({ ...orderData, is_draft: true } as any);
                        }}
                        disabled={isCreatingOrder}
                        className="gap-2 px-6 font-bold h-10 border-primary text-primary hover:bg-primary/5"
                      >
                        <HugeiconsIcon icon={Add01Icon} size={18} />
                        Save as Draft {isSavingDraft ? "..." : ""}
                      </Button> */}
                      <Button
                        type="submit"
                        onClick={(e) => {
                          console.log("clik")
                        }}
                        className="gap-2 px-8  shadow-sm  min-w-[160px] disabled:bg-muted"
                        disabled={isSubmitting || (currentStep === 4 && (
                          (() => {
                            const user = queryClient.getQueryData<any>(["me"]);
                            const orderCountData = queryClient.getQueryData<any>(["order-count"]);
                            const isFirstOrder = orderCountData?.total === 0;
                            const isKycVerified = user?.kyc_status === 'VERIFIED';
                            const hasSecurityDeposit = parseFloat(user?.security_deposit || "0") > 0;
                            return isFirstOrder && (!isKycVerified || !hasSecurityDeposit);
                          })()
                        ))}
                      >
                        {isSubmitting ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={18} /> : <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />}
                        {isSubmitting ? submissionStatus : "Create Order"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </m.div>
        </AnimatePresence>
      </LazyMotion>

      {/* Sheets & Dialogs */}
      <Sheet open={openAddPickupSheet} onOpenChange={setOpenAddPickupSheet}>
        <SheetContent className="min-w-full  md:min-w-[600px]">
          <SheetHeader className="pb-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                <HugeiconsIcon icon={ShippingTruck01Icon} size={20} />
              </div>
              <div>
                <SheetTitle>Register Warehouse</SheetTitle>
                <SheetDescription>Add a new pickup location</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="grid gap-8 py-8 ">
            {/* Hub Identity */}
            <div className="space-y-4 px-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hub Identity</h4>
              <Field data-invalid={!!pickupForm.formState.errors.pickup_location}>
                <FieldLabel className="text-[10px] font-bold uppercase">Location Nickname</FieldLabel>

                <p className="text-[10px] text-muted-foreground">Used to identify this warehouse in your pickup list.</p>
                <div className="relative">
                  <HugeiconsIcon icon={ShippingTruck01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                  <Input {...pickupForm.register("pickup_location")} aria-invalid={!!pickupForm.formState.errors.pickup_location} placeholder="e.g. Mumbai Main Hub" className="pl-9" />
                </div>
                <FieldError errors={[pickupForm.formState.errors.pickup_location]} className="text-[10px] font-bold uppercase" />
              </Field>
            </div>

            <Separator />

            {/* Contact Details */}
            <div className="space-y-4 px-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!pickupForm.formState.errors.name}>
                  <FieldLabel className="text-[10px] font-bold uppercase">Name</FieldLabel>
                  <div className="relative">
                    <HugeiconsIcon icon={AccountSetting03Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                    <Input {...pickupForm.register("name")} aria-invalid={!!pickupForm.formState.errors.name} placeholder="Name" className="pl-9" />
                  </div>
                  <FieldError errors={[pickupForm.formState.errors.name]} className="text-[10px] font-bold uppercase" />
                </Field>
                <Field data-invalid={!!pickupForm.formState.errors.phone}>
                  <FieldLabel className="text-[10px] font-bold uppercase">Phone</FieldLabel>
                  <div className="relative">
                    <HugeiconsIcon icon={SmartPhone01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                    <Input {...pickupForm.register("phone")} aria-invalid={!!pickupForm.formState.errors.phone} placeholder="Mobile Number" className="pl-9" />
                  </div>
                  <FieldError errors={[pickupForm.formState.errors.phone]} className="text-[10px] font-bold uppercase" />
                </Field>
              </div>
              <Field data-invalid={!!pickupForm.formState.errors.email}>
                <FieldLabel className="text-[10px] font-bold uppercase">Email Address</FieldLabel>
                <div className="relative">
                  <HugeiconsIcon icon={Mail01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                  <Input {...pickupForm.register("email")} aria-invalid={!!pickupForm.formState.errors.email} placeholder="warehouse@example.com" className="pl-9" />
                </div>
                <FieldError errors={[pickupForm.formState.errors.email]} className="text-[10px] font-bold uppercase" />
              </Field>
            </div>

            <Separator />

            {/* Location Details */}
            <div className="space-y-4 px-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!pickupForm.formState.errors.pin_code}>
                  <FieldLabel className="text-[10px] font-bold uppercase">Pincode</FieldLabel>
                  <div className="relative">
                    <HugeiconsIcon icon={MapsCircle01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />

                    <Input
                      {...pickupForm.register("pin_code")}
                      aria-invalid={!!pickupForm.formState.errors.pin_code}
                      placeholder="000000"
                      className={cn(
                        "font-bold tracking-widest pl-9",
                        sheetPincodeData?.postcode_details && sheetPincodeData?.success ? "border-green-500 focus-visible:ring-green-500" : "border-red-500",
                        sheetPincode?.length === 6 && !sheetPincodeData?.postcode_details && !isLoadingSheetPincode && "border-destructive focus-visible:ring-destructive",
                        pickupForm.formState.errors.pin_code && "border-destructive"
                      )}
                    />
                    {isLoadingSheetPincode && (
                      <HugeiconsIcon icon={Loading03Icon} className="animate-spin absolute right-3 top-2.5 text-primary" size={16} />
                    )}
                  </div>
                  {sheetPincodeData?.postcode_details && sheetPincodeData?.success ? (
                    <p className={cn(
                      "text-[10px] text-green-600 font-bold uppercase flex items-center gap-1 mt-1.5",
                      sheetPincodeData?.postcode_details && sheetPincodeData?.success ? "visible" : "invisible",

                    )}>
                      <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} />
                      Serviceable: {sheetPincodeData.postcode_details.city}
                    </p>
                  ) : sheetPincode?.length === 6 && !isLoadingSheetPincode && (
                    <p className="text-[10px] text-destructive font-bold uppercase mt-1.5">Invalid Pincode</p>
                  )}
                  <FieldError errors={[pickupForm.formState.errors.pin_code]} className="text-[10px] font-bold uppercase" />
                </Field>
                <Field data-invalid={!!pickupForm.formState.errors.city}>
                  <FieldLabel className="text-[10px] font-bold uppercase">City / State</FieldLabel>
                  <Input disabled {...pickupForm.register("city")} aria-invalid={!!pickupForm.formState.errors.city} placeholder="Auto-detected" className="bg-muted opacity-70" />
                  <FieldError errors={[pickupForm.formState.errors.city]} className="text-[10px] font-bold uppercase" />
                </Field>
              </div>
              <Field data-invalid={!!pickupForm.formState.errors.address}>
                <FieldLabel className="text-[10px] font-bold uppercase">Building / Street Address</FieldLabel>
                <Input {...pickupForm.register("address")} aria-invalid={!!pickupForm.formState.errors.address} placeholder="Flat No, Road, Area..." />
                <FieldError errors={[pickupForm.formState.errors.address]} className="text-[10px] font-bold uppercase" />
              </Field>
            </div>
          </div>

          <SheetFooter className="pt-6 border-t">
            <Button
              className="w-full"
              onClick={pickupForm.handleSubmit((d) => saveShiprocketPickupMutation(d as any))}
              disabled={isSavingShiprocketPickup || (sheetPincode?.length === 6 && !sheetPincodeData?.postcode_details)}
            >
              {isSavingShiprocketPickup ? (
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin mr-2" size={16} />
              ) : (
                <HugeiconsIcon icon={Add01Icon} className="mr-2" size={16} />
              )}
              {isSavingShiprocketPickup ? "Adding Location..." : "Add Pickup Location"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={openOtpDialog} onOpenChange={setOpenOtpDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Verification Required</DialogTitle>
            <DialogDescription>Enter the 6-digit code sent to your phone.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} className="text-center text-2xl tracking-[0.5em] h-14 font-mono" placeholder="000000" maxLength={6} />
            <Button variant="ghost" size="sm" onClick={handleResendOtp} className="w-full text-xs text-muted-foreground">Didn&apos;t receive code? Resend</Button>
          </div>
          <DialogFooter>
            <Button onClick={handleVerifyOtp} className="w-full" disabled={isVerifyingOtp}>Verify & Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDraftDialog} onOpenChange={(open) => { if (!open) { setShowLoadDraftDialog(false); setDraftToLoad(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Load Draft</DialogTitle>
            <DialogDescription>Would you like to refresh courier rates or use your saved courier selection?</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Button onClick={() => handleLoadDraft(true)} className="w-full gap-2">
              <HugeiconsIcon icon={TruckIcon} size={18} />
              Refresh Courier Rates
            </Button>
            <Button variant="outline" onClick={() => handleLoadDraft(false)} className="w-full gap-2">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
              Use Saved Courier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StepOne({ form, fields, append, remove, allSuggestions, formValues, isLoadingPickup, isPickupValid, pickupLocality, isLoadingDelivery, isDeliveryValid, deliveryLocality, shiprocketPickups, selectShiprocketPickup, setOpenAddPickupSheet }: any) {
  const { errors } = form.formState;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <HugeiconsIcon icon={Configuration02Icon} size={18} className="text-primary" />
              Service & Size
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 foex">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Select value={formValues.pickup_location} onValueChange={(val) => { const sel = shiprocketPickups?.find((l: any) => l.pickup_location === val); if (sel) { selectShiprocketPickup(sel); form.setValue("pickup_location", val); } }}>
                  <SelectTrigger className="h-10 text-xs w-full"><SelectValue placeholder="Saved Hubs..." /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Addresses</SelectLabel>
                      {shiprocketPickups.map((l: any) => (<SelectItem key={l.id} value={l.pickup_location} className="text-xs">{l.pickup_location} - {l.pin_code}</SelectItem>))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button variant="secondary" className="ring-1 ring-muted-foreground/30" onClick={() => setOpenAddPickupSheet(true)}><HugeiconsIcon icon={LocationAdd01Icon} size={18} /> Add</Button>
              </div>
              {errors.pickup_location && <p className="text-[10px] text-destructive font-bold uppercase ml-1">{errors.pickup_location.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.pickup_address?.pincode}>
                <FieldLabel className="text-xs font-bold text-muted-foreground uppercase">Pickup Pincode</FieldLabel>
                <Input
                  {...form.register("pickup_address.pincode")}
                  aria-invalid={!!errors.pickup_address?.pincode}
                  placeholder="000000"
                  className={cn("h-10", !isPickupValid && formValues.pickup_address.pincode?.length === 6 && "border-destructive")}
                />
                {isLoadingPickup ? <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">Verifying...</p> : isPickupValid ? <p className="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-tight">{pickupLocality?.data?.postcode_details?.city || pickupLocality?.postcode_details?.city}</p> : formValues.pickup_address.pincode?.length === 6 && <p className="text-[10px] text-destructive font-bold mt-1 uppercase tracking-tight">Invalid</p>}
                <FieldError errors={[errors.pickup_address?.pincode]} className="text-[10px] font-bold uppercase" />
              </Field>

              <Field data-invalid={!!errors.receiver_address?.pincode}>
                <FieldLabel className="text-xs font-bold text-muted-foreground uppercase">
                  Delivery Pincode
                </FieldLabel>
                <Input
                  {...form.register("receiver_address.pincode")}
                  aria-invalid={!!errors.receiver_address?.pincode}
                  placeholder="000000"
                  className={cn("h-10", !isDeliveryValid && formValues.receiver_address.pincode?.length === 6 && "border-destructive")}
                />
                {isLoadingDelivery ? <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">Verifying...</p> : isDeliveryValid ? <p className="text-[10px] text-green-600 font-bold mt-1 uppercase tracking-tight">{deliveryLocality?.data?.postcode_details?.city || deliveryLocality?.postcode_details?.city}</p> : formValues.receiver_address.pincode?.length === 6 && <p className="text-[10px] text-destructive font-bold mt-1 uppercase tracking-tight">Invalid</p>}
                <FieldError errors={[errors.receiver_address?.pincode]} className="text-[10px] font-bold uppercase" />
              </Field>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              {/* <Field data-invalid={!!errors.order_type}><FieldLabel className="text-xs font-bold text-muted-foreground uppercase">Mode</FieldLabel>
                <Select onValueChange={(v) => form.setValue("order_type", v as any)} value={formValues.order_type}>
                  <SelectTrigger aria-invalid={!!errors.order_type} className=""><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SURFACE">Surface</SelectItem>
                    <SelectItem value="EXPRESS">Express</SelectItem>
                    <SelectItem value="CARGO">Cargo</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.order_type]} className="text-[10px] font-bold uppercase" />
              </Field> */}
              <Field data-invalid={!!errors.payment_mode}><FieldLabel className="text-xs font-bold text-muted-foreground uppercase">Payment</FieldLabel>
                <Select onValueChange={(v) => form.setValue("payment_mode", v as any)} value={formValues.payment_mode}>
                  <SelectTrigger aria-invalid={!!errors.payment_mode} className=""><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PREPAID">Prepaid</SelectItem><SelectItem value="COD">COD</SelectItem></SelectContent>
                </Select>
                <FieldError errors={[errors.payment_mode]} className="text-[10px] font-bold uppercase" />
              </Field>
            </div>
            {formValues.payment_mode === "COD" && (
              <Field data-invalid={!!errors.cod_amount}><FieldLabel className="text-xs font-bold text-muted-foreground uppercase">COD Amount</FieldLabel>
                <div className="relative">
                  <HugeiconsIcon icon={CreditCardIcon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                  <Input type="number" {...form.register("cod_amount", { valueAsNumber: true })} aria-invalid={!!errors.cod_amount} className="pl-9" />
                </div>
                <FieldError errors={[errors.cod_amount]} className="text-[10px] font-bold uppercase" />
              </Field>
            )}
            <Separator />
            <div className="space-y-4">
              <Field data-invalid={!!errors.weight}><FieldLabel className="text-xs font-bold text-muted-foreground uppercase">Dead Weight (KG)</FieldLabel>
                <div className="relative">
                  <HugeiconsIcon icon={Package01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                  <Input type="number" step="0.1" {...form.register("weight", { valueAsNumber: true })} aria-invalid={!!errors.weight} className="h-11 font-bold text-lg pl-10" />
                </div>
                <FieldError errors={[errors.weight]} className="text-[10px] font-bold uppercase" />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field data-invalid={!!errors.length}>
                  <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase">Length</FieldLabel>
                  <Input type="number" {...form.register("length", { valueAsNumber: true })} aria-invalid={!!errors.length} className="text-center h-10 px-1" placeholder="L" />
                  <FieldError errors={[errors.length]} className="text-[10px] font-bold uppercase" />
                </Field>
                <Field data-invalid={!!errors.width}>
                  <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase">Width</FieldLabel>
                  <Input type="number" {...form.register("width", { valueAsNumber: true })} aria-invalid={!!errors.width} className="text-center h-10 px-1" placeholder="W" />
                  <FieldError errors={[errors.width]} className="text-[10px] font-bold uppercase" />
                </Field>
                <Field data-invalid={!!errors.height}>
                  <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase">Height</FieldLabel>
                  <Input type="number" {...form.register("height", { valueAsNumber: true })} aria-invalid={!!errors.height} className="text-center h-10 px-1" placeholder="H" />
                  <FieldError errors={[errors.height]} className="text-[10px] font-bold uppercase" />
                </Field>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-7">
        <Card className="shadow-sm overflow-hidden h-full">
          <CardHeader className="pb-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <HugeiconsIcon icon={Package01Icon} size={18} className="text-primary" />
                Package Contents
              </CardTitle>
              <Button type="button" variant="secondary" size="sm" onClick={() => append({ name: "", quantity: 1, price: 0 })} className="h-8 gap-1.5  px-3">
                <HugeiconsIcon icon={Add01Icon} size={14} /> Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {fields.map((field: any, index: number) => (
                <div key={field.id} className="flex flex-col md:flex-row items-start gap-4 p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex-1 w-full space-y-1.5">
                    <Field data-invalid={!!errors.products?.[index]?.name}>
                      <Label htmlFor={`product-name-${field.id}`} className="text-[10px] font-bold uppercase text-muted-foreground">Item Name</Label>
                      <Input id={`product-name-${field.id}`} placeholder="Enter product name" {...form.register(`products.${index}.name` as const)} list="products" className="h-10" />
                      <FieldError errors={[errors.products?.[index]?.name]} className="text-[10px] font-bold uppercase" />
                    </Field>
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Field data-invalid={!!errors.products?.[index]?.quantity}>
                      <Label htmlFor={`product-qty-${field.id}`} className="text-[10px] font-bold uppercase text-muted-foreground">Qty</Label>
                      <Input id={`product-qty-${field.id}`} type="number" {...form.register(`products.${index}.quantity` as const, { valueAsNumber: true })} className="h-10 text-center font-bold" />
                      <FieldError errors={[errors.products?.[index]?.quantity]} className="text-[10px] font-bold uppercase" />
                    </Field>
                  </div>
                  <div className="w-32 space-y-1.5">
                    <Field data-invalid={!!errors.products?.[index]?.price}>
                      <Label htmlFor={`product-price-${field.id}`} className="text-[10px] font-bold uppercase text-muted-foreground">Price (₹)</Label>
                      <Input id={`product-price-${field.id}`} type="number" {...form.register(`products.${index}.price` as const, { valueAsNumber: true })} className="h-10 font-bold" />
                      <FieldError errors={[errors.products?.[index]?.price]} className="text-[10px] font-bold uppercase" />
                    </Field>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-10 w-10 mt-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => remove(index)} disabled={fields.length === 1}>
                    <HugeiconsIcon icon={Delete01Icon} size={16} />
                  </Button>
                </div>
              ))}
              <datalist id="products">{allSuggestions.map((s: string) => <option key={s} value={s} />)}</datalist>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 py-4 flex flex-col items-stretch border-t gap-4">
            <div className="flex justify-between items-center w-full">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Declared Value</span>
              <div className="text-xl font-bold">₹{formValues.total_amount.toLocaleString("en-IN")}</div>
            </div>
            {formValues.total_amount >= 2500 && (
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
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function StepTwo({ form, shiprocketPickups, savedAddresses, selectSavedAddress, selectShiprocketPickup, formValues, isLoadingPickup, isPickupValid, pickupLocality, isLoadingDelivery, isDeliveryValid, deliveryLocality }: any) {
  const { watch } = form;
  const pickupLocationValue = watch("pickup_location");
  const receiverPincodeValue = watch("receiver_address.pincode");

  // Auto-fill receiver address from Step 1 delivery pincode when entering Step 2
  React.useEffect(() => {
    // Only fill if pincode exists, locality data is loaded (not loading), and city is not already set
    if (formValues.receiver_address.pincode && deliveryLocality && !isLoadingDelivery) {
      const postcodeData = deliveryLocality?.data?.postcode_details || deliveryLocality?.postcode_details;
      if (postcodeData && !formValues.receiver_address.city) {
        form.setValue("receiver_address.city", postcodeData.city || "", { shouldValidate: false });
      }
      if (postcodeData && !formValues.receiver_address.state) {
        form.setValue("receiver_address.state", postcodeData.state || "", { shouldValidate: false });
      }
    }
  }, [deliveryLocality, formValues.receiver_address.pincode, isLoadingDelivery, form]);

  // Keep sender empty by default - only fill when "Same as pickup" is checked
  React.useEffect(() => {
    if (!formValues.same_as_pickup) {
      // Clear sender when checkbox is unchecked
      form.setValue("pickup_address.name", "");
      form.setValue("pickup_address.phone", "");
      form.setValue("pickup_address.email", "");
      form.setValue("pickup_address.pincode", "");
      form.setValue("pickup_address.address", "");
      form.setValue("pickup_address.city", "");
      form.setValue("pickup_address.state", "");
    }
  }, [formValues.same_as_pickup]);

  const handleSameAsPickupChange = (checked: boolean) => {
    form.setValue("same_as_pickup", !!checked);
    if (checked && formValues.pickup_location) {
      const sel = shiprocketPickups?.find((l: any) => l.pickup_location === formValues.pickup_location);
      if (sel) {
        // Fill sender (pickup) address with hub details when checkbox is checked
        form.setValue("pickup_address.name", sel.name || "", { shouldValidate: true });
        form.setValue("pickup_address.phone", sel.phone || "", { shouldValidate: true });
        form.setValue("pickup_address.email", sel.email || "", { shouldValidate: true });
        form.setValue("pickup_address.pincode", sel.pin_code?.toString() || "", { shouldValidate: true });
        form.setValue("pickup_address.address", sel.address || "", { shouldValidate: true });
        form.setValue("pickup_address.city", sel.city || "", { shouldValidate: true });
        form.setValue("pickup_address.state", sel.state || "", { shouldValidate: true });
      }
    } else {
      // Clear sender when unchecked
      form.setValue("pickup_address.name", "");
      form.setValue("pickup_address.phone", "");
      form.setValue("pickup_address.email", "");
      form.setValue("pickup_address.pincode", "");
      form.setValue("pickup_address.address", "");
      form.setValue("pickup_address.city", "");
      form.setValue("pickup_address.state", "");
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AddressFormCard prefix="pickup_address" title="Sender Details" icon={UserCircle02Icon} savedAddresses={savedAddresses} onSelect={(a: any) => selectSavedAddress(a, "pickup_address")} isLoading={isLoadingPickup} isValid={isPickupValid} locality={pickupLocality} form={form} />
        <AddressFormCard prefix="receiver_address" title="Receiver Details" icon={UserGroupIcon} savedAddresses={savedAddresses} onSelect={(a: any) => selectSavedAddress(a, "receiver_address")} isLoading={isLoadingDelivery} isValid={isDeliveryValid} locality={deliveryLocality} form={form} readOnlyPincode={formValues.same_as_pickup} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 border bg-muted/20 rounded-xl">
        <div className="flex items-center space-x-2">
          <Checkbox id="same-as" checked={formValues.same_as_pickup} onCheckedChange={handleSameAsPickupChange} />
          <Label htmlFor="same-as" className="text-sm font-medium cursor-pointer">Details same as pickup hub</Label>
        </div>
        {/* <div className="flex items-center space-x-2">
          <Checkbox id="make-pickup" checked={formValues.make_pickup_address} onCheckedChange={(c) => form.setValue("make_pickup_address", !!c)} />
          <Label htmlFor="make-pickup" className="text-sm font-medium cursor-pointer">Register this as new hub</Label>
        </div> */}
        {/* <div className="flex items-center space-x-2">
          <Checkbox id="save-addresses" checked={formValues.save_receiver_address} onCheckedChange={(c) => {
            form.setValue("save_pickup_address", !!c);
            form.setValue("save_receiver_address", !!c);
          }} />
          <Label htmlFor="save-addresses" className="text-sm font-medium cursor-pointer">Save addresses</Label>
        </div> */}
        {formValues.make_pickup_address && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
            <Input {...form.register("new_pickup_location_name")} placeholder="New Hub Name" className="h-10" />
            <Input {...form.register("new_pickup_gst")} placeholder="GST (Optional)" className="h-10" />
          </div>
        )}
      </div>
    </div>
  );
}

function StepThree({ form, rateData, isLoadingRates, formValues, refetchRates }: any) {
  const { errors } = form.formState;
  const [isRefetching, setRefetching] = useState(false);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRefetching === true) {
      timer = setTimeout(() => {
        setRefetching(false);
      }, 700);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isRefetching])
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-bold">Select Courier</h2>
          {errors.courier_id && <p className="text-xs text-destructive font-bold uppercase mt-1">Please select a courier partner to continue</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { refetchRates(); setRefetching(true); }} disabled={isLoadingRates} className="h-9 gap-2">
          <HugeiconsIcon icon={Loading03Icon} className={cn("size-4", isLoadingRates || isRefetching && "animate-spin")} />
          Refresh Rates
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4  bg-muted/30 border border-border flex items-center gap-4">
          <div className="bg-background p-2 rounded-md shadow-sm"><HugeiconsIcon icon={Location01Icon} size={18} className="text-primary" /></div>
          <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Pickup</p><p className="text-sm font-semibold">{formValues.pickup_address.city} <span className="font-normal opacity-60">({formValues.pickup_address.pincode})</span></p></div>
        </div>
        <div className="p-4  bg-muted/30 border border-border flex items-center gap-4">
          <div className="bg-background p-2 rounded-md shadow-sm"><HugeiconsIcon icon={Navigation01Icon} size={18} className="text-primary" /></div>
          <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Destination</p><p className="text-sm font-semibold">{formValues.receiver_address.city} <span className="font-normal opacity-60">({formValues.receiver_address.pincode})</span></p></div>
        </div>
      </div>

      <div className="space-y-3">
        {isLoadingRates ? (
          ["cr-1", "cr-2", "cr-3", "cr-4"].map((id) => <Skeleton key={id} className="h-20 w-full rounded-xl" />)
        ) : rateData?.serviceable_couriers?.length ? (
          rateData.serviceable_couriers.map((courier: CourierPartner) => (
            <div
              key={courier.courier_company_id}
              role="button"
              tabIndex={0}
              onClick={() => {
                form.setValue("courier_id", courier.courier_company_id);
                form.setValue("courier_name", courier.courier_name);
                form.setValue("shipping_charge", Math.round(courier.rate * 100) / 100);
                form.setValue("total_amount", Math.round(courier.rate * 100) / 100);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  form.setValue("courier_id", courier.courier_company_id);
                  form.setValue("courier_name", courier.courier_name);
                  form.setValue("shipping_charge", Math.round(courier.rate * 100) / 100);
                  form.setValue("total_amount", Math.round(courier.rate * 100) / 100);
                }
              }}
              className={cn(
                "p-4 border rounded-xl cursor-pointer transition-all flex flex-col md:flex-row items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                formValues.courier_id === courier.courier_company_id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={cn("h-12 w-12  flex items-center justify-center", formValues.courier_id === courier.courier_company_id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <HugeiconsIcon icon={courier.mode.toLowerCase() === "surface" ? TruckIcon : RocketIcon} size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{courier.courier_name}</span>
                    {courier.is_recommended && <Badge variant="secondary" className="text-[10px] h-5 rounded-md px-1.5 uppercase font-bold">Recommended</Badge>}
                    {(courier as any).custom_tag && <Badge variant="outline" className="text-[10px] h-5 rounded-md px-1.5 uppercase font-bold border-primary text-primary bg-primary/5">{(courier as any).custom_tag}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{courier.delivery_in_days} Days Delivery • {courier.mode}</p>
                </div>
              </div>
              <div className="flex items-center justify-between w-full md:w-auto md:gap-10">
                <div className="text-right">
                  <p className="text-2xl font-bold">₹{courier.rate.toFixed(2)}</p>
                  <p className="text-[9px] text-green-600 font-bold uppercase tracking-tight">Incl. GST</p>
                </div>
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", formValues.courier_id === courier.courier_company_id ? "border-primary bg-primary text-white" : "border-muted")}>
                  {formValues.courier_id === courier.courier_company_id && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center border rounded-xl border-dashed bg-muted/10">
            <HugeiconsIcon icon={Cancel01Icon} className="mx-auto mb-3 text-muted-foreground opacity-50" size={32} />
            <p className="text-sm font-medium">No couriers available for this route.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationCard({
  isKycVerified,
  hasSecurityDeposit,
  router,
}: {
  isKycVerified: boolean;
  hasSecurityDeposit: boolean;
  router: any;
}) {
  const steps = [
    {
      title: "KYC Verification",
      description: "Verify Aadhaar or PAN details",
      completed: isKycVerified,
      action: () => router.push("/dashboard/settings?tab=kyc"),
      actionLabel: "Verify",
    },
    {
      title: "Security Deposit",
      description: "One-time refundable deposit",
      completed: hasSecurityDeposit,
      action: () => router.push("/dashboard/wallet"),
      actionLabel: "Pay Now",
    },
  ]

  return (
    <Card className="border-muted/60 shadow-sm overflow-hidden">
      <CardHeader className="space-y-1 pb-4 bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={Shield01Icon} size={18} className="text-primary" />
          First Shipment Verification
        </CardTitle>

        <CardDescription className="text-xs leading-relaxed">
          Complete verification and pay a refundable security deposit
          before creating your first shipment.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between rounded-lg border p-3 transition-colors",
              "bg-muted/40 hover:bg-muted/60"
            )}
          >
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border",
                  step.completed
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                )}
              >
                {step.completed ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-600" />
                ) : (
                  <HugeiconsIcon icon={Cancel01Icon} size={16} className="text-amber-500" />
                )}
              </div>

              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Right CTA */}
            {!step.completed && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs font-medium"
                onClick={step.action}
              >
                {step.actionLabel}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function StepFour({ formValues, isShipped, createdOrderId, router, http , shiprocketPickups }: any) {
  const { data: user } = useQuery<any>(
    http.get(["me"], "/auth/me", true)
  );
  const sel = shiprocketPickups?.find((l: any) => l.pickup_location === formValues.pickup_location);
  const { data: orderCountData } = useQuery<any>(
    http.get(["order-count"], "/orders/count", true)
  );

  const isFirstOrder = orderCountData?.ordersCount === 0;
  const isKycVerified = user?.kyc_status === 'VERIFIED';
  const hasSecurityDeposit = parseFloat(user?.security_deposit || "0") > 0;

  const showVerificationBlock = isFirstOrder && (!isKycVerified || !hasSecurityDeposit);

  if (isShipped) return (
    <div className="py-12 text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center border-4 border-primary/20">
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Success!</h2>
        <p className="text-muted-foreground">Order ID: <span className="font-bold text-foreground">#{createdOrderId}</span></p>
      </div>
      <div className="flex justify-center gap-3 pt-4">
        <Button onClick={() => router.push('/dashboard/orders')} className="w-32">My Orders</Button>
        <Button variant="outline" onClick={() => window.location.reload()} className="w-32">Ship Another</Button>
      </div>
      <div className="pt-6 border-t mt-8 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Ready to hand over your package?</p>
        <Button onClick={() => router.push(`/dashboard/orders/${createdOrderId}`)} size="lg" className="gap-2 font-bold w-full max-w-sm mx-auto shadow-md">
          <HugeiconsIcon icon={ShippingTruck01Icon} size={18} />
          Schedule Pickup Now
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* KYC & Deposit Alerts for First Order */}
      {showVerificationBlock && (
        <VerificationCard
          isKycVerified={isKycVerified}
          hasSecurityDeposit={hasSecurityDeposit}
          router={router}
        />
      )}
      
      {/* Tabs for Shipment, Pickup Hub, Sender, Receiver */}
      <Tabs defaultValue="shipment" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-5 p-1 bg-transparent h-30">
          <TabsTrigger value="shipment" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
            <HugeiconsIcon icon={Package01Icon} size={16} />
            <span className="text-xs font-bold">Shipment</span>
          </TabsTrigger>
          <TabsTrigger value="pickup" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-green-500 data-[state=active]:text-white">
            <HugeiconsIcon icon={Location01Icon} size={16} />
            <span className="text-xs font-bold">Pickup Hub</span>
          </TabsTrigger>
          <TabsTrigger value="sender" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <HugeiconsIcon icon={UserCircle02Icon} size={16} />
            <span className="text-xs font-bold">Sender</span>
          </TabsTrigger>
          <TabsTrigger value="receiver" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <HugeiconsIcon icon={Navigation01Icon} size={16} />
            <span className="text-xs font-bold">Receiver</span>
          </TabsTrigger>
        </TabsList>

        {/* Shipment Tab */}
        <TabsContent value="shipment" className="mt-4">
          <Card className="shadow-sm border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Courier</p>
                  <p className="font-bold text-primary">{formValues.courier_name || "Not selected"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Type</p>
                  <Badge variant="outline">{formValues.order_type}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Weight</p>
                  <p className="font-bold">{formValues.weight} kg</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Mode</p>
                  <p className="font-bold">{formValues.payment_mode === 'COD' ? 'COD' : 'Prepaid'}</p>
                </div>
                {formValues.products?.[0]?.name && (
                  <div className="col-span-2 md:col-span-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Product</p>
                    <p className="font-medium">{formValues.products[0].name} × {formValues.products[0].quantity}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pickup Hub Tab */}
        <TabsContent value="pickup" className="mt-4">
          <Card className="shadow-sm border-green-500/20">
            <CardContent className="pt-6">
              {sel ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Hub Name</p>
                    <p className="font-bold">{sel.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Phone</p>
                    <p className="font-bold">{sel.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Pincode</p>
                    <p className="font-bold">{sel.pin_code}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">City</p>
                    <p className="font-bold">{sel.city}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">State</p>
                    <p className="font-bold">{sel.state}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Hub Location</p>
                    <Badge variant="secondary">{sel.pickup_location}</Badge>
                  </div>
                  <div className="col-span-2 md:col-span-3 pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Address</p>
                    <p className="font-medium">{sel.address}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No pickup hub selected</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sender Tab */}
        <TabsContent value="sender" className="mt-4">
          <Card className="shadow-sm border-blue-500/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Name</p>
                  <p className="font-bold">{formValues.pickup_address.name || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Phone</p>
                  <p className="font-bold">{formValues.pickup_address.phone || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Email</p>
                  <p className="font-medium truncate">{formValues.pickup_address.email || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Pincode</p>
                  <p className="font-bold">{formValues.pickup_address.pincode || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">City</p>
                  <p className="font-bold">{formValues.pickup_address.city || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">State</p>
                  <p className="font-bold">{formValues.pickup_address.state || "-"}</p>
                </div>
                {formValues.pickup_address.address && (
                  <div className="col-span-2 md:col-span-3 pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Address</p>
                    <p className="font-medium">{formValues.pickup_address.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receiver Tab */}
        <TabsContent value="receiver" className="mt-4">
          <Card className="shadow-sm border-orange-500/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Name</p>
                  <p className="font-bold">{formValues.receiver_address.name || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Phone</p>
                  <p className="font-bold">{formValues.receiver_address.phone || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Email</p>
                  <p className="font-medium truncate">{formValues.receiver_address.email || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Pincode</p>
                  <p className="font-bold">{formValues.receiver_address.pincode || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">City</p>
                  <p className="font-bold">{formValues.receiver_address.city || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">State</p>
                  <p className="font-bold">{formValues.receiver_address.state || "-"}</p>
                </div>
                {formValues.receiver_address.address && (
                  <div className="col-span-2 md:col-span-3 pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Address</p>
                    <p className="font-medium">{formValues.receiver_address.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shipping Charge Summary */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card border rounded-xl">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Base Charge</p>
          <p className="font-black text-lg">₹{formatPrice(formValues.total_amount || 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Delivery</p>
          <p className="font-bold text-green-600">{formValues.payment_mode === 'COD' ? 'COD' : 'Prepaid'}</p>
        </div>
        {formValues.payment_mode === 'COD' && (
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">COD Fee</p>
            <p className="font-bold">₹0</p>
          </div>
        )}
        <div className="text-center bg-primary/5 rounded-lg py-2">
          <p className="text-[10px] font-bold uppercase text-primary tracking-widest">Total</p>
          <p className="font-black text-xl text-primary">₹{formatPrice(formValues.shipping_charge || 0)}</p>
        </div>
      </div> */}

      <div className="p-6 border-2 border-dashed rounded-xl bg-primary/5 text-center space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase">Total Shipping Charge</p>
        <div className="text-5xl font-black tabular-nums tracking-tighter text-primary">₹{formatPrice(formValues.shipping_charge || 0)}</div>
        <p className="text-xs text-muted-foreground max-w-[300px] mx-auto">By confirming, the amount will be automatically deducted from your wallet balance.</p>
      </div>

    </div>
  );
}

function AddressFormCard({ prefix, title, icon: Icon, savedAddresses, onSelect, isLoading, isValid, locality, form, readOnlyPincode }: any) {
  const { errors } = form.formState;
  const fieldErrors = (prefix === "pickup_address" ? errors.pickup_address : errors.receiver_address) as any;
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [matchingAddress, setMatchingAddress] = useState<any>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    form.setValue(`${prefix}.phone`, value, { shouldValidate: true });

    if (value.length >= 10 && savedAddresses?.length) {
      const foundAddress = savedAddresses.find((addr: any) => addr.phone === value);
      if (foundAddress) {
        setMatchingAddress(foundAddress);
        setShowAddressDialog(true);
      }
    }
  };

  const handleSelectMatchingAddress = () => {
    if (matchingAddress) {
      onSelect(matchingAddress);
    }
    setShowAddressDialog(false);
    setMatchingAddress(null);
  };

  const handleCancelMatchingAddress = () => {
    setShowAddressDialog(false);
    setMatchingAddress(null);
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <HugeiconsIcon icon={Icon} size={18} className="text-primary" />
              {title}
            </CardTitle>
            <Popover>
              <PopoverTrigger render={<Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase px-2 hover:bg-muted border border-muted-foreground/10">+ Book</Button>} />
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b bg-muted/30 font-bold text-xs uppercase tracking-tight">Saved Addresses</div>
                <div className="max-h-60 overflow-y-auto">
                  {savedAddresses?.length ? savedAddresses.map((a: any) => (
                    <div
                      key={a.id}
                      role="button"
                      tabIndex={0}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-0 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      onClick={() => onSelect(a)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(a);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{a.name}</span>
                        <Badge variant="outline" className="text-[8px] h-4 uppercase">{a.address_label || "Other"}</Badge>
                      </div>
                      <p className="text-muted-foreground truncate">{a.complete_address}</p>
                    </div>
                  )) : <div className="p-6 text-center text-xs text-muted-foreground opacity-50 italic">No addresses saved.</div>}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!fieldErrors?.name}>
              <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Name</FieldLabel>
              <div className="relative">
                <HugeiconsIcon icon={UserCircle02Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                <Input placeholder="John Doe" {...form.register(`${prefix}.name`)} aria-invalid={!!fieldErrors?.name} className="pl-9" />
              </div>
              <FieldError errors={[fieldErrors?.name]} className="text-[10px] font-bold uppercase ml-1" />
            </Field>
            <Field data-invalid={!!fieldErrors?.phone}>
              <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Phone</FieldLabel>
              <div className="relative">
                <HugeiconsIcon icon={SmartPhone01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                <Input
                  placeholder="10-digit mobile"
                  {...form.register(`${prefix}.phone`)}
                  onChange={handlePhoneChange}
                  aria-invalid={!!fieldErrors?.phone}
                  className="pl-9"
                />
              </div>
              <FieldError errors={[fieldErrors?.phone]} className="text-[10px] font-bold uppercase ml-1" />
            </Field>
          </div>
          <Field data-invalid={!!fieldErrors?.email}>
            <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Email (Optional)</FieldLabel>
            <div className="relative">
              <HugeiconsIcon icon={Mail01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
              <Input placeholder="m@example.com" {...form.register(`${prefix}.email`)} aria-invalid={!!fieldErrors?.email} className="pl-9" />
            </div>
            <FieldError errors={[fieldErrors?.email]} className="text-[10px] font-bold uppercase ml-1" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!fieldErrors?.pincode}>
              <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Pincode</FieldLabel>
              <div className="relative">
                <HugeiconsIcon icon={Location01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                <Input
                  readOnly={readOnlyPincode}
                  placeholder="000000"
                  {...form.register(`${prefix}.pincode`)}
                  aria-invalid={!!fieldErrors?.pincode}
                  className={cn("pl-9 font-bold", readOnlyPincode && "bg-muted/50 cursor-not-allowed")}
                />
                {!readOnlyPincode && isLoading && <HugeiconsIcon icon={Loading03Icon} className="animate-spin absolute right-3 top-2.5 size-4 text-primary" />}
              </div>
              <FieldError errors={[fieldErrors?.pincode]} className="text-[10px] font-bold uppercase ml-1" />
            </Field>
            <Field data-invalid={!!fieldErrors?.city}>
              <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase ml-1">City</FieldLabel>
              <Input disabled placeholder="Detecting..." {...form.register(`${prefix}.city`)} aria-invalid={!!fieldErrors?.city} className="bg-muted opacity-80" />
              <FieldError errors={[fieldErrors?.city]} className="text-[10px] font-bold uppercase ml-1" />
            </Field>
          </div>
          {isValid && <p className="text-[10px] font-black text-green-600 uppercase px-1">Serviceable: {locality?.postcode_details?.city}, {locality?.postcode_details?.state}</p>}
          <Field data-invalid={!!fieldErrors?.address}>
            <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Address</FieldLabel>
            <div className="relative">
              <HugeiconsIcon icon={Navigation01Icon} className="absolute left-3 top-3 text-muted-foreground/50" size={14} />
              <Input placeholder="Full street address..." {...form.register(`${prefix}.address`)} aria-invalid={!!fieldErrors?.address} className="pl-9" />
            </div>
            <FieldError errors={[fieldErrors?.address]} className="text-[10px] font-bold uppercase ml-1" />
          </Field>
        </CardContent>

        {/* Dialog for matching address */}
        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Address Found</DialogTitle>
              <DialogDescription>We found an address saved with this phone number.</DialogDescription>
            </DialogHeader>
            {matchingAddress && (
              <div className="py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{matchingAddress.name}</span>
                  <Badge variant="outline" className="text-[8px]">{matchingAddress.address_label || "Other"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{matchingAddress.complete_address}</p>
                <p className="text-xs text-muted-foreground">{matchingAddress.city}, {matchingAddress.state} - {matchingAddress.pincode}</p>
              </div>
            )}
            <DialogFooter className="flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCancelMatchingAddress} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSelectMatchingAddress} className="flex-1">
                Select Address
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );
}
