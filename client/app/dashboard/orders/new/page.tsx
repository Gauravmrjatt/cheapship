"use client";
import confetti from "canvas-confetti"
import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHttp } from "@/lib/hooks/use-http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Package01Icon,
  ShippingTruck01Icon,
  UserCircle02Icon,
  UserGroupIcon,
  Add01Icon,
  SearchIcon,
  CreditCardIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  Wallet01Icon,
  AddressBookIcon,
  Location01Icon,
  FloppyDiskIcon,
  StarIcon,
  TruckIcon,
  RocketIcon,
  Navigation01Icon,
  Delete01Icon,
  CheckmarkBadge01Icon,
  Loading03Icon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";

const steps = [
  { id: 1, title: "Service", icon: Package01Icon },
  { id: 2, title: "Details", icon: ShippingTruck01Icon },
  { id: 3, title: "Sender", icon: UserCircle02Icon },
  { id: 4, title: "Receiver", icon: UserGroupIcon },
  { id: 5, title: "Couriers", icon: TruckIcon },
  { id: 6, title: "Items", icon: Add01Icon },
  { id: 7, title: "Review", icon: SearchIcon },
  { id: 8, title: "Finish", icon: CreditCardIcon },
];

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  email?: string;
  complete_address: string;
  city: string;
  state: string;
  pin_code: string;
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

export default function CreateOrderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [openPickupPopover, setOpenPickupPopover] = useState(false);
  const [openShiprocketPopover, setOpenShiprocketPopover] = useState(false);
  const [isShipped, setShipped] = useState(false);
  const [openReceiverPopover, setOpenReceiverPopover] = useState(false);
  const [openAddPickupSheet, setOpenAddPickupSheet] = useState(false);
  const router = useRouter();
  const http = useHttp();
  const queryClient = useQueryClient();

  const pickupForm = useForm<z.infer<typeof shiprocketPickupSchema>>({
    resolver: zodResolver(shiprocketPickupSchema),
    defaultValues: {
      pickup_location: "",
      name: "",
      phone: "",
      email: "",
      pin_code: "",
      address: "",
      city: "",
      state: "",
      country: "India",
    },
    mode: "onChange",
  });

  const { mutate, isPending } = useMutation(
    http.post("/orders", {
      onSuccess: () => {
        setShipped(true);
        toast.success("Order created successfully");
        const end = Date.now() + 3 * 1000 // 3 seconds
        const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]
        const frame = () => {
          if (Date.now() > end) return
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            startVelocity: 60,
            origin: { x: 0, y: 0.5 },
            colors: colors,
          })
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            startVelocity: 60,
            origin: { x: 1, y: 0.5 },
            colors: colors,
          })
          requestAnimationFrame(frame)
        }
        frame()
        // router.push("/dashboard/orders");
      },
    })
  );

  const { mutate: saveAddressMutation, isPending: isSavingAddress } = useMutation(
    http.post("/addresses", {
      onSuccess: () => {
        toast.success("Address saved to address book");
        queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      },
    })
  );

    const { mutate: saveShiprocketPickupMutation, isPending: isSavingShiprocketPickup } = useMutation(

      http.post("/addresses/pickup", {

        onSuccess: (data: any) => {

          if (data.success) {

            toast.success("Shiprocket pickup location created");

            queryClient.invalidateQueries({ queryKey: ["shiprocket-pickup-locations"] });

            setOpenAddPickupSheet(false);

            pickupForm.reset();

          } else {

            let errorMsg = data.message || "Failed to create Shiprocket pickup location";

            try {

              const parsed = JSON.parse(data.message);

              if (typeof parsed === "object") {

                errorMsg = Object.values(parsed).flat().join(", ");

              }

            } catch (e) {}

            toast.error(errorMsg);

          }

        },

      })

    );

  

  const { mutate: deleteAddressMutation } = useMutation(
    http.del("/addresses", {
      onSuccess: () => {
        toast.success("Address deleted");
        queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      },
    })
  );

  const form = useForm<z.infer<typeof createOrderSchema>>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      order_type: "SURFACE",
      shipment_type: "DOMESTIC",
      payment_mode: "PREPAID",
      total_amount: 0,
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      pickup_location: "",
      pickup_address: {
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      },
      receiver_address: {
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      },
      products: [{ name: "", quantity: 1, price: 0 }],
      save_pickup_address: false,
      save_receiver_address: false,
    },
  });

  const { errors } = form.formState;
  const formValues = form.watch();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const { data: savedAddresses } = useQuery<SavedAddress[]>(
    http.get(["saved-addresses"], "/addresses", true)
  );

  const { data: shiprocketPickups } = useQuery<any>(
    http.get(["shiprocket-pickup-locations"], "/addresses/pickup", true)
  );

  const shiprocketPickupLocations = shiprocketPickups?.data?.shipping_address || [];

  // Fetch Pickup Locality Details
  const { data: pickupLocality, isLoading: isLoadingPickup } = useQuery<any>(
    http.get(
      ["pincode-details", formValues.pickup_address.pincode],
      `/orders/pincode-details?postcode=${formValues.pickup_address.pincode}`,
      formValues.pickup_address.pincode?.length === 6
    )
  );

  const { data: deliveryLocality, isLoading: isLoadingDelivery } = useQuery<any>(
    http.get(
      ["pincode-details", formValues.receiver_address.pincode],
      `/orders/pincode-details?postcode=${formValues.receiver_address.pincode}`,
      formValues.receiver_address.pincode?.length === 6
    )
  );

  const sheetPincode = pickupForm.watch("pin_code");
  const { data: sheetPincodeData, isLoading: isLoadingSheetPincode } = useQuery<any>(
    http.get(
      ["pincode-details-sheet", sheetPincode],
      `/orders/pincode-details?postcode=${sheetPincode}`,
      sheetPincode?.length === 6
    )
  );

  useEffect(() => {
    if (sheetPincodeData?.success || !!sheetPincodeData?.postcode_details) {
      const details = sheetPincodeData.postcode_details;
      pickupForm.setValue("city", details.city, { shouldValidate: true });
      pickupForm.setValue("state", details.state, { shouldValidate: true });
    } else {
      pickupForm.setValue("city", "");
      pickupForm.setValue("state", "");
    }
  }, [sheetPincodeData, pickupForm]);

  const isPickupPincodeValid = pickupLocality?.success || !!pickupLocality?.postcode_details;
  const isDeliveryPincodeValid = deliveryLocality?.success || !!deliveryLocality?.postcode_details;

  // Real-time auto-fill for pickup address
  useEffect(() => {
    if (isPickupPincodeValid) {
      const details = pickupLocality.postcode_details;
      form.setValue("pickup_address.city", details.city, { shouldValidate: true });
      form.setValue("pickup_address.state", details.state, { shouldValidate: true });
    }
  }, [isPickupPincodeValid, pickupLocality, form]);

  // Real-time auto-fill for delivery address
  useEffect(() => {
    if (isDeliveryPincodeValid) {
      const details = deliveryLocality.postcode_details;
      form.setValue("receiver_address.city", details.city, { shouldValidate: true });
      form.setValue("receiver_address.state", details.state, { shouldValidate: true });
    }
  }, [isDeliveryPincodeValid, deliveryLocality, form]);

  // Courier Rates Query
  const rateQueryParams = useMemo(() => new URLSearchParams({
    pickup_postcode: formValues.pickup_address.pincode,
    delivery_postcode: formValues.receiver_address.pincode,
    weight: formValues.weight?.toString(),
    cod: formValues.payment_mode === "COD" ? "1" : "0",
    declared_value: formValues.total_amount?.toString(),
    length: formValues.length?.toString(),
    breadth: formValues.width?.toString(),
    height: formValues.height?.toString(),
    mode: formValues.order_type === "SURFACE" ? "Surface" : "Air"
  }).toString(), [formValues, currentStep]);

  const { data: rateData, isLoading: isLoadingRates, refetch: refetchRates } = useQuery<RateResponse>(
    http.get(
      ["order-rates", rateQueryParams],
      `/orders/calculate-rates?${rateQueryParams}`,
      currentStep === 5
    )
  );

  const nextStep = async () => {
    if (currentStep === 3 && !isPickupPincodeValid) {
      toast.error("Please provide a valid pickup pincode");
      return;
    }
    if (currentStep === 4 && !isDeliveryPincodeValid) {
      toast.error("Please provide a valid delivery pincode");
      return;
    }
    if (currentStep === 5 && !formValues.courier_id) {
      toast.error("Please select a courier partner");
      return;
    }

    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1: return ["order_type", "shipment_type", "payment_mode"];
      case 2: return ["weight", "length", "width", "height", "total_amount", "pickup_location"];
      case 3: return ["pickup_address.name", "pickup_address.phone", "pickup_address.pincode", "pickup_address.address"];
      case 4: return ["receiver_address.name", "receiver_address.phone", "receiver_address.pincode", "receiver_address.address"];
      case 5: return ["courier_id"];
      case 6: return ["products"];
      default: return [];
    }
  };

  function onSubmit(values: z.infer<typeof createOrderSchema>) {
    mutate({...values , total_amount :  Number(values.shipping_charge || 0)} as any);
  }

  const selectSavedAddress = (address: SavedAddress, prefix: "pickup_address" | "receiver_address") => {
    form.setValue(`${prefix}.name`, address.name);
    form.setValue(`${prefix}.phone`, address.phone);
    form.setValue(`${prefix}.email`, address.email || "");
    form.setValue(`${prefix}.pincode`, address.pincode);
    form.setValue(`${prefix}.address`, address.complete_address);
    form.setValue(`${prefix}.city`, address.city);
    form.setValue(`${prefix}.state`, address.state);

    // Close the corresponding popover
    if (prefix === "pickup_address") {
      setOpenPickupPopover(false);
    } else {
      setOpenReceiverPopover(false);
    }
  };

  const selectShiprocketPickup = (addr: ShiprocketPickupLocation) => {
    form.setValue("pickup_address.name", addr.name);
    form.setValue("pickup_address.phone", addr.phone);
    form.setValue("pickup_address.email", addr.email || "");
    form.setValue("pickup_address.pincode", addr.pin_code.toString());
    form.setValue("pickup_address.address", addr.address);
    form.setValue("pickup_address.city", addr.city);
    form.setValue("pickup_address.state", addr.state);
    setOpenShiprocketPopover(false);
  };

  const handleSaveAddressNow = (prefix: "pickup_address" | "receiver_address") => {
    const addr = formValues[prefix];
    if (!addr.name || !addr.phone || !addr.address || !addr.pincode || !addr.city || !addr.state) {
      toast.error("Please fill all required address fields first");
      return;
    }
    saveAddressMutation({
      name: addr.name,
      phone: addr.phone,
      email: addr.email,
      complete_address: addr.address,
      pincode: addr.pincode,
      city: addr.city,
      state: addr.state,
      address_label: prefix === "pickup_address" ? "Pickup" : "Receiver",
      is_default: false
    } as any);
  };

  const handleRegisterShiprocketPickup = pickupForm.handleSubmit((data) => {
    if (!(sheetPincodeData?.success || !!sheetPincodeData?.postcode_details)) {
      toast.error("Please provide a valid pincode");
      return;
    }

    saveShiprocketPickupMutation(data as any);
  });

  const syncPickupFromMain = () => {
    const addr = formValues.pickup_address;
    pickupForm.setValue("name", addr.name);
    pickupForm.setValue("phone", addr.phone);
    pickupForm.setValue("email", addr.email || "");
    pickupForm.setValue("pin_code", addr.pincode);
    pickupForm.setValue("address", addr.address);
    pickupForm.setValue("city", addr.city);
    pickupForm.setValue("state", addr.state);
    toast.success("Details copied from sender address");
  };

  const handleDeleteSavedAddress = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent selecting the address
    if (confirm("Are you sure you want to delete this saved address?")) {
      deleteAddressMutation(id as any);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight">Service Configuration</h2>
              <p className="text-sm text-muted-foreground">Select delivery speed and type</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3 mb-8">
                <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Delivery Speed</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { type: "SURFACE", desc: "Standard Delivery", detail: "Best for heavy cargo", icon: ShippingTruck01Icon },
                    { type: "EXPRESS", desc: "Priority Air", detail: "Fastest delivery time", icon: Package01Icon }
                  ].map((item) => (
                    <div
                      key={item.type}
                      onClick={() => form.setValue("order_type", item.type as "SURFACE" | "EXPRESS")}
                      className={cn(
                        "cursor-pointer border rounded-xl  transition-all hover:border-primary/10 hover:bg-accent/10 p-9",
                        form.watch("order_type") === item.type ? "border-primary bg-accent/20 ring-1 ring-primary" : "bg-card",
                        errors.order_type && "border-destructive ring-1 ring-destructive"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          form.watch("order_type") === item.type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <HugeiconsIcon icon={item.icon} size={20} />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold leading-none">{item.desc}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <FieldError errors={[errors.order_type]} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-9 mt-5">
                <div className="space-y-3">
                  <Label className="text-sm font-medium leading-none">Service Area</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: "DOMESTIC", icon: Location01Icon, label: "Domestic" },
                      { type: "INTERNATIONAL", icon: Package01Icon, label: "Intl." }
                    ].map((item) => (
                      <div
                        key={item.type}
                        onClick={() => form.setValue("shipment_type", item.type as "DOMESTIC" | "INTERNATIONAL")}
                        className={cn(
                          "cursor-pointer border rounded-xl  transition-all hover:border-primary/10 hover:bg-accent/10 flex flex-col items-center justify-center gap-2 h-24",
                          form.watch("shipment_type") === item.type ? "border-primary bg-accent/20 ring-1 ring-primary" : "bg-card",
                          errors.shipment_type && "border-destructive ring-1 ring-destructive"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-md",
                          form.watch("shipment_type") === item.type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <HugeiconsIcon icon={item.icon} size={18} />
                        </div>
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <FieldError errors={[errors.shipment_type]} />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium leading-none">Payment Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: "PREPAID", icon: Wallet01Icon, label: "Prepaid" },
                      { type: "COD", icon: CreditCardIcon, label: "COD" }
                    ].map((item) => (
                      <div
                        key={item.type}
                        onClick={() => form.setValue("payment_mode", item.type as "PREPAID" | "COD")}
                        className={cn(
                          "cursor-pointer border rounded-xl  transition-all hover:border-primary/10 hover:bg-accent/10 flex flex-col items-center justify-center gap-2 h-24",
                          form.watch("payment_mode") === item.type ? "border-primary bg-accent/20 ring-1 ring-primary" : "bg-card",
                          errors.payment_mode && "border-destructive ring-1 ring-destructive"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-md",
                          form.watch("payment_mode") === item.type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <HugeiconsIcon icon={item.icon} size={18} />
                        </div>
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <FieldError errors={[errors.payment_mode]} />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight">Shipment Details</h2>
              <p className="text-sm text-muted-foreground">Dimensions and economic value</p>
            </div>

            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium leading-none">Pickup Location (Shiprocket)</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-2"
                      onClick={() => setOpenAddPickupSheet(true)}
                    >
                      <HugeiconsIcon icon={Add01Icon} size={14} />
                      Add New
                    </Button>
                  </div>
                  <Controller
                    control={form.control}
                    name="pickup_location"
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selected = shiprocketPickupLocations.find((loc: ShiprocketPickupLocation) => loc.pickup_location === value);
                          if (selected) {
                            selectShiprocketPickup(selected);
                          }
                        }}
                        value={field.value}
                      >
                        <SelectTrigger className={cn(errors.pickup_location && "border-destructive")}>
                          <SelectValue placeholder="Select a registered pickup location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {shiprocketPickupLocations.map((loc: ShiprocketPickupLocation) => (
                              <SelectItem key={loc.id} value={loc.pickup_location}>
                                {loc.pickup_location} ({loc.city})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-[0.8rem] text-muted-foreground">Select where the package will be picked up from</p>
                  <FieldError errors={[errors.pickup_location]} />
                </div>

                <Sheet open={openAddPickupSheet} onOpenChange={setOpenAddPickupSheet}>
                  <SheetContent className="sm:w-full overflow-y-auto min-w-[50dvw]">
                    <SheetHeader>
                      <SheetTitle>Add Pickup Location</SheetTitle>
                      <SheetDescription>
                        Register a new pickup location with Shiprocket.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-6 p-7">
                      <Field data-invalid={!!pickupForm.formState.errors.pickup_location}>
                        <FieldLabel className="text-xs">Location Nickname</FieldLabel>
                        <Input
                          placeholder="e.g. Warehouse-1"
                          {...pickupForm.register("pickup_location")}
                        />
                        <FieldError errors={[pickupForm.formState.errors.pickup_location]} />
                      </Field>
                      <Separator />
                      <div className="grid grid-cols-1 gap-4">
                        <Field data-invalid={!!pickupForm.formState.errors.name}>
                          <FieldLabel className="text-xs">Contact Name</FieldLabel>
                          <Input {...pickupForm.register("name")} />
                          <FieldError errors={[pickupForm.formState.errors.name]} />
                        </Field>
                        <Field data-invalid={!!pickupForm.formState.errors.phone}>
                          <FieldLabel className="text-xs">Phone Number</FieldLabel>
                          <Input {...pickupForm.register("phone")} />
                          <FieldError errors={[pickupForm.formState.errors.phone]} />
                        </Field>
                        <Field data-invalid={!!pickupForm.formState.errors.email}>
                          <FieldLabel className="text-xs">Email Address</FieldLabel>
                          <Input {...pickupForm.register("email")} />
                          <FieldError errors={[pickupForm.formState.errors.email]} />
                        </Field>
                        <Field data-invalid={!!pickupForm.formState.errors.pin_code}>
                          <FieldLabel className="text-xs">Pincode</FieldLabel>
                          <div className="relative">
                            <Input {...pickupForm.register("pin_code")} />
                            {isLoadingSheetPincode && <div className="absolute right-3 top-1/2 -translate-y-1/2"><HugeiconsIcon icon={Loading03Icon} className="animate-spin text-muted-foreground" size={16} /></div>}
                          </div>
                          <FieldError errors={[pickupForm.formState.errors.pin_code]} />
                        </Field>
                        <Field data-invalid={!!pickupForm.formState.errors.address}>
                          <FieldLabel className="text-xs">Full Address</FieldLabel>
                          <Input
                            {...pickupForm.register("address")}
                            placeholder="Include House/Flat No, Building, Road etc."
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">Min 10 chars. Must include House/Flat/Road No.</p>
                          <FieldError errors={[pickupForm.formState.errors.address]} />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                          <Field data-invalid={!!pickupForm.formState.errors.city}>
                            <FieldLabel className="text-xs">City</FieldLabel>
                            <Input className="bg-muted" {...pickupForm.register("city")} disabled />
                            <FieldError errors={[pickupForm.formState.errors.city]} />
                          </Field>
                          <Field data-invalid={!!pickupForm.formState.errors.state}>
                            <FieldLabel className="text-xs">State</FieldLabel>
                            <Input className="bg-muted" {...pickupForm.register("state")} disabled />
                            <FieldError errors={[pickupForm.formState.errors.state]} />
                          </Field>
                        </div>
                      </div>
                    </div>
                    <SheetFooter>
                      <Button
                        className="w-full gap-2"
                        onClick={handleRegisterShiprocketPickup}
                        disabled={isSavingShiprocketPickup}
                      >
                        {isSavingShiprocketPickup ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={16} /> : <HugeiconsIcon icon={FloppyDiskIcon} size={16} />}
                        Register & Save
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-sm font-medium leading-none">Dimensions & Weight</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Field data-invalid={!!errors.weight}>
                      <FieldLabel className="text-xs">Weight (kg)</FieldLabel>
                      <Input type="number" step="0.1" className="" aria-invalid={!!errors.weight} {...form.register("weight", { valueAsNumber: true })} />
                      <FieldError errors={[errors.weight]} />
                    </Field>
                    <Field data-invalid={!!errors.length}>
                      <FieldLabel className="text-xs">Length (cm)</FieldLabel>
                      <Input type="number" className="" aria-invalid={!!errors.length} {...form.register("length", { valueAsNumber: true })} />
                      <FieldError errors={[errors.length]} />
                    </Field>
                    <Field data-invalid={!!errors.width}>
                      <FieldLabel className="text-xs">Width (cm)</FieldLabel>
                      <Input type="number" className="" aria-invalid={!!errors.width} {...form.register("width", { valueAsNumber: true })} />
                      <FieldError errors={[errors.width]} />
                    </Field>
                    <Field data-invalid={!!errors.height}>
                      <FieldLabel className="text-xs">Height (cm)</FieldLabel>
                      <Input type="number" className="" aria-invalid={!!errors.height} {...form.register("height", { valueAsNumber: true })} />
                      <FieldError errors={[errors.height]} />
                    </Field>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-sm font-medium leading-none">Shipment Value</Label>
                  <Field data-invalid={!!errors.total_amount}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">₹</span>
                      <Input type="number" className="pl-7 " aria-invalid={!!errors.total_amount} {...form.register("total_amount", { valueAsNumber: true })} />
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground mt-1.5">Used for insurance and liability coverage.</p>
                    <FieldError errors={[errors.total_amount]} />
                  </Field>
                </div>
              </div>
            </Card>
          </div>
        );
      case 3:
      case 4:
        const isPickup = currentStep === 3;
        const prefix = isPickup ? "pickup_address" : "receiver_address";
        const addrErrors = errors[prefix as keyof typeof errors] as any;

        const currentPincode = isPickup ? formValues.pickup_address.pincode : formValues.receiver_address.pincode;
        const currentLocality = isPickup ? pickupLocality : deliveryLocality;
        const isCurrentLoading = isPickup ? isLoadingPickup : isLoadingDelivery;
        const isCurrentValid = isPickup ? isPickupPincodeValid : isDeliveryPincodeValid;

        const openPopover = isPickup ? openPickupPopover : openReceiverPopover;
        const setOpenPopover = isPickup ? setOpenPickupPopover : setOpenReceiverPopover;

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold tracking-tight">{isPickup ? "Sender" : "Receiver"} Address</h2>
                <p className="text-sm text-muted-foreground">{isPickup ? "Pickup location details" : "Delivery destination details"}</p>
              </div>

              {savedAddresses && savedAddresses.length > 0 && (
                <Popover open={openPopover} onOpenChange={setOpenPopover}>
                  <PopoverTrigger asChild>
                    <Button onClick={(e) => e.preventDefault()} variant="outline" size="sm" className="h-9 gap-2">
                      <HugeiconsIcon icon={AddressBookIcon} size={16} />
                      Saved Addresses
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b">
                      <p className="text-sm font-medium leading-none">Address Book</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="group p-4 hover:bg-muted cursor-pointer border-b last:border-0 relative"
                          onClick={() => selectSavedAddress(addr, prefix)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{addr.name}</span>
                            <div className="flex items-center gap-2">
                              {addr.address_label && (
                                <Badge variant="secondary" className="text-[10px] h-5">{addr.address_label}</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDeleteSavedAddress(e, addr.id)}
                              >
                                <HugeiconsIcon icon={Delete01Icon} size={14} />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <HugeiconsIcon icon={Location01Icon} size={14} className="shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{addr.complete_address}, {addr.city}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* {isPickup && shiprocketPickupLocations.length > 0 && (
                <Popover open={openShiprocketPopover} onOpenChange={setOpenShiprocketPopover}>
                  <PopoverTrigger asChild>
                    <Button onClick={(e) => e.preventDefault()} variant="outline" size="sm" className="h-9 gap-2">
                      <HugeiconsIcon icon={RocketIcon} size={16} />
                       Pickup Locations
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b">
                      <p className="text-sm font-medium leading-none">Pickup Locations</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {shiprocketPickupLocations.map((addr: ShiprocketPickupLocation) => (
                        <div 
                          key={addr.id} 
                          className="group p-4 hover:bg-muted cursor-pointer border-b last:border-0 relative"
                          onClick={() => selectShiprocketPickup(addr)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{addr.pickup_location}</span>
                            <Badge variant="outline" className="text-[10px] h-5">{addr.name}</Badge>
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <HugeiconsIcon icon={Location01Icon} size={14} className="shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{addr.address}, {addr.city}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )} */}
            </div>

            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field data-invalid={!!addrErrors?.name}><FieldLabel className="text-xs">Contact Name</FieldLabel><Input className="" aria-invalid={!!addrErrors?.name} {...form.register(`${prefix}.name` as any)} /><FieldError errors={[addrErrors?.name]} /></Field>
                <Field data-invalid={!!addrErrors?.phone}><FieldLabel className="text-xs">Phone Number</FieldLabel><Input className="" aria-invalid={!!addrErrors?.phone} {...form.register(`${prefix}.phone` as any)} /><FieldError errors={[addrErrors?.phone]} /></Field>
                <Field data-invalid={!!addrErrors?.email}><FieldLabel className="text-xs">Email Address</FieldLabel><Input className="" aria-invalid={!!addrErrors?.email} {...form.register(`${prefix}.email` as any)} /><FieldError errors={[addrErrors?.email]} /></Field>
                <Field data-invalid={!!addrErrors?.pincode}>
                  <FieldLabel className="text-xs">Pincode</FieldLabel>
                  <div className="relative">
                    <Input className={cn("", !isCurrentValid && currentPincode?.length === 6 && "border-destructive focus-visible:ring-destructive")} aria-invalid={!!addrErrors?.pincode} {...form.register(`${prefix}.pincode` as any)} />
                    {isCurrentLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><HugeiconsIcon icon={Loading03Icon} className="animate-spin text-muted-foreground" size={16} /></div>}
                  </div>
                  {isCurrentValid && (
                    <p className="text-[0.8rem] text-green-600 mt-1.5 flex items-center gap-1.5">
                      <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} />
                      {currentLocality?.postcode_details?.city}, {currentLocality?.postcode_details?.state}
                    </p>
                  )}
                  {!isCurrentValid && currentPincode?.length === 6 && !isCurrentLoading && (
                    <p className="text-[0.8rem] text-destructive mt-1.5">Invalid Pincode</p>
                  )}
                  <FieldError errors={[addrErrors?.pincode]} />
                </Field>
                <div className="md:col-span-2">
                  <Field data-invalid={!!addrErrors?.address}><FieldLabel className="text-xs">Full Address</FieldLabel><Input className="" aria-invalid={!!addrErrors?.address} {...form.register(`${prefix}.address` as any)} /><FieldError errors={[addrErrors?.address]} /></Field>
                </div>
                <Field data-invalid={!!addrErrors?.city}><FieldLabel className="text-xs">City</FieldLabel><Input className="bg-muted" aria-invalid={!!addrErrors?.city} {...form.register(`${prefix}.city` as any)} disabled={true} /><FieldError errors={[addrErrors?.city]} /></Field>
                <Field data-invalid={!!addrErrors?.state}><FieldLabel className="text-xs">State</FieldLabel><Input className="bg-muted" aria-invalid={!!addrErrors?.state} {...form.register(`${prefix}.state` as any)} disabled={true} /><FieldError errors={[addrErrors?.state]} /></Field>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="flex items-center space-x-2">
                  <Controller
                    control={form.control}
                    name={isPickup ? "save_pickup_address" : "save_receiver_address"}
                    render={({ field }) => (
                      <Checkbox
                        id={`save-${prefix}`}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor={`save-${prefix}`} className="text-sm font-medium">Save to address book</Label>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => handleSaveAddressNow(prefix)}
                  disabled={isSavingAddress}
                >
                  <HugeiconsIcon icon={FloppyDiskIcon} size={14} />
                  {isSavingAddress ? "Saving..." : "Save Now"}
                </Button>
              </div>

              {isPickup && (
                <div className="mt-6 pt-6 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={RocketIcon} size={18} className="text-primary" />
                      <h3 className="text-sm font-semibold">Pickup Registration</h3>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] uppercase font-bold text-primary"
                      onClick={syncPickupFromMain}
                    >
                      Fill from Sender Address
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Register this location to enable pickups. You must provide a unique nickname.</p>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Location Nickname</Label>
                      <Input
                        placeholder="e.g. Warehouse-1"
                        {...pickupForm.register("pickup_location")}
                        className="h-9 mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2"
                      onClick={handleRegisterShiprocketPickup}
                      disabled={isSavingShiprocketPickup || !pickupForm.watch("pickup_location")}
                    >
                      {isSavingShiprocketPickup ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={14} /> : <HugeiconsIcon icon={Add01Icon} size={14} />}
                      Register Location
                    </Button>
                  </div>
                  {pickupForm.formState.errors.pickup_location && (
                    <p className="text-[10px] text-destructive">{pickupForm.formState.errors.pickup_location.message}</p>
                  )}
                </div>
              )}
            </Card>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight">Select Courier</h2>
              <p className="text-sm text-muted-foreground">Compare rates and estimated delivery dates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 flex flex-row items-center gap-4 shadow-sm">
                <div className="bg-muted p-2.5 rounded-lg"><HugeiconsIcon icon={Location01Icon} className="h-5 w-5 text-muted-foreground" /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Origin</p>
                  <p className="text-sm font-semibold">{formValues.pickup_address.city} <span className="text-muted-foreground font-normal">{formValues.pickup_address.pincode}</span></p>
                </div>
              </Card>
              <Card className="p-4 flex flex-row items-center gap-4 shadow-sm">
                <div className="bg-muted p-2.5 rounded-lg"><HugeiconsIcon icon={Navigation01Icon} className="h-5 w-5 text-muted-foreground" /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</p>
                  <p className="text-sm font-semibold">{formValues.receiver_address.city} <span className="text-muted-foreground font-normal">{formValues.receiver_address.pincode}</span></p>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              {isLoadingRates ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-6"><Skeleton className="h-16 w-full" /></Card>
                ))
              ) : !rateData?.serviceable_couriers || rateData.serviceable_couriers.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <div className="bg-muted h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HugeiconsIcon icon={SearchIcon} className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No Couriers Found</h3>
                  <p className="text-muted-foreground text-sm mt-1">Try changing the weight or service mode.</p>
                  <Button onClick={() => refetchRates()} variant="outline" className="mt-6">Retry Search</Button>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {rateData.serviceable_couriers.map((courier, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        form.setValue("courier_id", courier.courier_company_id);
                        form.setValue("courier_name", courier.courier_name);
                        form.setValue("shipping_charge", courier.rate);
                        form.setValue("base_shipping_charge", (courier as any).base_rate);
                      }}
                      className={cn(
                        "transition-all duration-200 border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-accent/10",
                        formValues.courier_id === courier.courier_company_id ? "border-primary bg-accent/30 ring-1 ring-primary" : "bg-card"
                      )}
                    >
                      <div className="p-4 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 flex items-center gap-4 w-full">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={courier.mode.toLowerCase() === "surface" ? TruckIcon : RocketIcon} size={20} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{courier.courier_name}</h3>
                              {courier.is_recommended && (
                                <Badge variant="secondary" className="text-[10px] h-5">Best Match</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <HugeiconsIcon icon={StarIcon} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {courier.rating.toFixed(1)}
                              </span>
                              <span>•</span>
                              <span>{courier.mode}</span>
                              <span>•</span>
                              <span>{courier.chargeable_weight} kg</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto md:border-l md:pl-8">
                          <div className="text-left md:text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">ETA</p>
                            <p className="text-sm font-semibold">{courier.delivery_in_days} Days</p>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Price</p>
                            <p className="text-xl font-bold">₹{courier.rate.toFixed(0)}</p>
                          </div>
                          <div className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                            formValues.courier_id === courier.courier_company_id ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                          )}>
                            {formValues.courier_id === courier.courier_company_id && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold tracking-tight">Shipment Contents</h2>
                <p className="text-sm text-muted-foreground">Declare items for customs and insurance</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => append({ name: "", quantity: 1, price: 0 })}
              >
                <HugeiconsIcon icon={Add01Icon} size={16} /> Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const productError = errors.products?.[index] as any;
                return (
                  <Card key={field.id} className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6">
                        <Field data-invalid={!!productError?.name}>
                          <FieldLabel className="text-xs">Item Name</FieldLabel>
                          <Input className="" placeholder="e.g. Cotton Shirt" aria-invalid={!!productError?.name} {...form.register(`products.${index}.name` as const)} />
                          <FieldError errors={[productError?.name]} />
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field data-invalid={!!productError?.quantity}>
                          <FieldLabel className="text-xs">Qty</FieldLabel>
                          <Input type="number" className="" aria-invalid={!!productError?.quantity} {...form.register(`products.${index}.quantity` as const, { valueAsNumber: true })} />
                          <FieldError errors={[productError?.quantity]} />
                        </Field>
                      </div>
                      <div className="md:col-span-3">
                        <Field data-invalid={!!productError?.price}>
                          <FieldLabel className="text-xs">Unit Price (₹)</FieldLabel>
                          <Input type="number" className="" aria-invalid={!!productError?.price} {...form.register(`products.${index}.price` as const, { valueAsNumber: true })} />
                          <FieldError errors={[productError?.price]} />
                        </Field>
                      </div>
                      <div className="md:col-span-1 flex justify-center pb-1">
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors" onClick={() => remove(index)}>
                            <HugeiconsIcon icon={Cancel01Icon} size={18} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
              {errors.products?.root && <FieldError errors={[errors.products.root]} />}
            </div>
          </div>
        );
      case 7:
        const values = form.getValues();
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight">Review Order</h2>
              <p className="text-sm text-muted-foreground">Double check details before payment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-6">
                <h3 className="font-semibold text-sm">Order Summary</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{values.order_type}</span>
                  </div>
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">Courier</span>
                    <span className="font-medium">{values.courier_name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium">{values.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium">{values.payment_mode}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-muted/30 border-primary/20 space-y-6">
                <h3 className="font-semibold text-sm text-primary">Cost Breakdown</h3>
                <div className="space-y-3 text-sm">
                  {/* <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipment Value</span>
                    <span>₹{values.total_amount}</span>
                  </div> */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping Charges</span>
                    <span className="text-green-600 font-medium">+ ₹{values.shipping_charge}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-end">
                    <span className="font-semibold">Total Payable</span>
                    <span className="text-2xl font-bold text-primary">₹{ Number(values.shipping_charge || 0).toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <HugeiconsIcon icon={Location01Icon} size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Pickup</span>
                    <p className="font-semibold text-sm">{values.pickup_address.name}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground pl-11">
                  <p>{values.pickup_address.address}</p>
                  <p>{values.pickup_address.city}, {values.pickup_address.state} - {values.pickup_address.pincode}</p>
                  <p className="mt-1">{values.pickup_address.phone}</p>
                </div>
              </Card>

              <Card className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <HugeiconsIcon icon={Navigation01Icon} size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Delivery</span>
                    <p className="font-semibold text-sm">{values.receiver_address.name}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground pl-11">
                  <p>{values.receiver_address.address}</p>
                  <p>{values.receiver_address.city}, {values.receiver_address.state} - {values.receiver_address.pincode}</p>
                  <p className="mt-1">{values.receiver_address.phone}</p>
                </div>
              </Card>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center py-16">
            {!isShipped ? <> <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              {isPending ? <HugeiconsIcon icon={Loading03Icon} size={40} /> : <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} />}
            </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl font-bold tracking-tight">Ready to Ship!</h2>
                <p className="text-muted-foreground">Your order is ready to ship. Proceed to generate the label and initiate the shipment.</p>
              </div>

              <Card className="max-w-xs mx-auto p-6 bg-muted/30 border-dashed">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Final Amount</p>
                <p className="text-4xl font-bold text-foreground">₹{(Number(formValues.total_amount) + Number(formValues.shipping_charge || 0)).toFixed(2)}</p>
              </Card></> : <>
              <div className="mx-auto w-20 h-20 bg-green-600 text-green-100 rounded-full flex items-center justify-center mb-6">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl font-bold tracking-tight">Shipped!</h2>
                <p className="text-muted-foreground">Your order is shipped. Proceed to generate the label and initiate the shipment.</p>
              </div>

              <Card className="max-w-xs mx-auto p-6 bg-muted/30 border-dashed">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Final Amount</p>
                <p className="text-4xl font-bold text-foreground">₹{(Number(formValues.total_amount) + Number(formValues.shipping_charge || 0)).toFixed(2)}</p>
              </Card>
            </>}

          </div>
        );
      default:
        return null;
    }
  };

  const isCurrentStepValid = () => {
    if (currentStep === 3) return isPickupPincodeValid;
    if (currentStep === 4) return isDeliveryPincodeValid;
    if (currentStep === 5) return !!formValues.courier_id;
    return true;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10 pb-32">
      <div className="px-2">
        <div className="flex justify-between items-start relative">
          <div className="absolute top-4.5 left-0 w-full h-px bg-muted -z-10" />
          <div
            className="absolute top-4.5 left-0 h-px bg-primary transition-all duration-500 -z-10"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex flex-col items-center gap-3 rounded-2xl">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ",
                    isActive ? "border-primary text-primary ring-4 ring-primary/10" :
                      isCompleted ? "bg-primary text-primary-foreground border-primary" :
                        "text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon icon={Icon} size={18} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider hidden md:block transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden border shadow-sm" >
        <CardContent className="p-8 md:p-10">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            {renderStepContent()}

            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1 || isPending}
                className={cn(
                  "gap-2",
                  currentStep === 1 ? "invisible" : "flex"
                )}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  className="gap-2 px-8"
                  onClick={(e) => { nextStep(); e.preventDefault() }}
                  disabled={!isCurrentStepValid()}
                >
                  Continue <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isPending || isShipped}
                  className={cn("gap-2 px-8", isShipped && "bg-muted text-muted-foreground hover:bg-muted coursor-disabled")}
                >
                  {isPending ? "Processing..." : !isShipped ? "Create Order" : "Shipped!"}
                  {!isPending && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />}
                  
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}