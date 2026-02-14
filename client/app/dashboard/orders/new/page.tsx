"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { createOrderSchema } from "@/lib/validators/order";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHttp } from "@/lib/hooks/use-http";
import { useMutation } from "@tanstack/react-query";
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
  InformationCircleIcon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const steps = [
  { id: 1, title: "Service", icon: Package01Icon },
  { id: 2, title: "Details", icon: ShippingTruck01Icon },
  { id: 3, title: "Sender", icon: UserCircle02Icon },
  { id: 4, title: "Receiver", icon: UserGroupIcon },
  { id: 5, title: "Items", icon: Add01Icon },
  { id: 6, title: "Review", icon: SearchIcon },
  { id: 7, title: "Finish", icon: CreditCardIcon },
];

export default function CreateOrderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const http = useHttp();
  
  const { mutate, isPending } = useMutation<void, Error, z.infer<typeof createOrderSchema>>(
    http.post<void, z.infer<typeof createOrderSchema>>(
      "/orders",
      {
        onSuccess: () => {
          toast.success("Order created successfully");
          router.push("/dashboard/orders");
        },
      }
    )
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
    },
  });

  const { errors } = form.formState;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const nextStep = async () => {
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
      case 1: return ["order_type"];
      case 2: return ["shipment_type", "payment_mode", "weight", "length", "width", "height", "total_amount"];
      case 3: return ["pickup_address"];
      case 4: return ["receiver_address"];
      case 5: return ["products"];
      default: return [];
    }
  };

  function onSubmit(values: z.infer<typeof createOrderSchema>) {
    mutate(values);
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Order Type</h2>
              <p className="text-sm text-muted-foreground">Select your preferred delivery service</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { type: "SURFACE", desc: "Reliable Road/Rail", detail: "Best for heavy bulk cargo" },
                { type: "EXPRESS", desc: "Priority Air", detail: "Fastest delivery for urgent shipments" }
              ].map((item) => (
                <div 
                  key={item.type}
                  onClick={() => form.setValue("order_type", item.type as "SURFACE" | "EXPRESS")}
                  className={cn(
                    "cursor-pointer border p-6 transition-all hover:bg-muted/50 rounded-2xl",
                    form.watch("order_type") === item.type ? "border-primary bg-primary/5" : "bg-card",
                    errors.order_type && "border-destructive ring-1 ring-destructive"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl",
                      form.watch("order_type") === item.type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <HugeiconsIcon icon={item.type === "SURFACE" ? ShippingTruck01Icon : Package01Icon} size={24} />
                    </div>
                    <div>
                      <p className="font-semibold">{item.type}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <FieldError errors={[errors.order_type]} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Shipment Details</h2>
              <p className="text-sm text-muted-foreground">Configure your shipment parameters</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field data-invalid={!!errors.shipment_type}>
                <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service Type</FieldLabel>
                <Controller
                  control={form.control}
                  name="shipment_type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 rounded-2xl" aria-invalid={!!errors.shipment_type}><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOMESTIC">Domestic</SelectItem>
                        <SelectItem value="INTERNATIONAL">International</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.shipment_type]} />
              </Field>
              <Field data-invalid={!!errors.payment_mode}>
                <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Mode</FieldLabel>
                <Controller
                  control={form.control}
                  name="payment_mode"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 rounded-2xl" aria-invalid={!!errors.payment_mode}><SelectValue placeholder="Mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PREPAID">Prepaid</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.payment_mode]} />
              </Field>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field data-invalid={!!errors.weight}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Weight (kg)</FieldLabel><Input type="number" step="0.1" className="h-9 rounded-2xl" aria-invalid={!!errors.weight} {...form.register("weight", { valueAsNumber: true })} /><FieldError errors={[errors.weight]} /></Field>
              <Field data-invalid={!!errors.length}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Length (cm)</FieldLabel><Input type="number" className="h-9 rounded-2xl" aria-invalid={!!errors.length} {...form.register("length", { valueAsNumber: true })} /><FieldError errors={[errors.length]} /></Field>
              <Field data-invalid={!!errors.width}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Width (cm)</FieldLabel><Input type="number" className="h-9 rounded-2xl" aria-invalid={!!errors.width} {...form.register("width", { valueAsNumber: true })} /><FieldError errors={[errors.width]} /></Field>
              <Field data-invalid={!!errors.height}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Height (cm)</FieldLabel><Input type="number" className="h-9 rounded-2xl" aria-invalid={!!errors.height} {...form.register("height", { valueAsNumber: true })} /><FieldError errors={[errors.height]} /></Field>
            </div>

            <Field data-invalid={!!errors.total_amount}>
              <FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Shipment Value (₹)</FieldLabel>
              <Input type="number" className="h-10 rounded-2xl text-lg font-semibold" aria-invalid={!!errors.total_amount} {...form.register("total_amount", { valueAsNumber: true })} />
              <FieldError errors={[errors.total_amount]} />
            </Field>
          </div>
        );
      case 3:
      case 4:
        const isPickup = currentStep === 3;
        const prefix = isPickup ? "pickup_address" : "receiver_address";
        const addrErrors = errors[prefix as keyof typeof errors] as any;
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">{isPickup ? "Sender" : "Receiver"} Address</h2>
              <p className="text-sm text-muted-foreground">{isPickup ? "Address for shipment pickup" : "Address for shipment delivery"}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field data-invalid={!!addrErrors?.name}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Contact Name</FieldLabel><Input className="h-9 rounded-2xl" aria-invalid={!!addrErrors?.name} {...form.register(`${prefix}.name` as any)} /><FieldError errors={[addrErrors?.name]} /></Field>
              <Field data-invalid={!!addrErrors?.phone}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Phone</FieldLabel><Input className="h-9 rounded-2xl" aria-invalid={!!addrErrors?.phone} {...form.register(`${prefix}.phone` as any)} /><FieldError errors={[addrErrors?.phone]} /></Field>
              <Field data-invalid={!!addrErrors?.email}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Email</FieldLabel><Input className="h-9 rounded-2xl" aria-invalid={!!addrErrors?.email} {...form.register(`${prefix}.email` as any)} /><FieldError errors={[addrErrors?.email]} /></Field>
              <Field data-invalid={!!addrErrors?.pincode}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Pincode</FieldLabel><Input className="h-9 rounded-2xl" aria-invalid={!!addrErrors?.pincode} {...form.register(`${prefix}.pincode` as any)} /><FieldError errors={[addrErrors?.pincode]} /></Field>
              <div className="md:col-span-2">
                <Field data-invalid={!!addrErrors?.address}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">Full Address</FieldLabel><Input className="h-9 rounded-2xl" aria-invalid={!!addrErrors?.address} {...form.register(`${prefix}.address` as any)} /><FieldError errors={[addrErrors?.address]} /></Field>
              </div>
              <Field data-invalid={!!addrErrors?.city}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">City</FieldLabel><Input className="h-9 rounded-2xl" aria-invalid={!!addrErrors?.city} {...form.register(`${prefix}.city` as any)} /><FieldError errors={[addrErrors?.city]} /></Field>
              <Field data-invalid={!!addrErrors?.state}><FieldLabel className="text-xs font-semibold uppercase text-muted-foreground">State</FieldLabel><Input className="h-9 rounded-2xl" aria-invalid={!!addrErrors?.state} {...form.register(`${prefix}.state` as any)} /><FieldError errors={[addrErrors?.state]} /></Field>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">Items</h2>
                <p className="text-sm text-muted-foreground">List the products in this shipment</p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="font-semibold text-xs rounded-2xl"
                onClick={() => append({ name: "", quantity: 1, price: 0 })}
              >
                <HugeiconsIcon icon={Add01Icon} className="mr-2" size={14} /> Add Item
              </Button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, index) => {
                const productError = errors.products?.[index] as any;
                return (
                  <div key={field.id} className="rounded-lg border p-4 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6">
                        <Field data-invalid={!!productError?.name}>
                          <FieldLabel className="text-[10px] font-bold uppercase text-muted-foreground">Item Name</FieldLabel>
                          <Input className="h-9 rounded-2xl bg-background" aria-invalid={!!productError?.name} {...form.register(`products.${index}.name` as const)} />
                          <FieldError errors={[productError?.name]} />
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field data-invalid={!!productError?.quantity}>
                          <FieldLabel className="text-[10px] font-bold uppercase text-muted-foreground">Qty</FieldLabel>
                          <Input type="number" className="h-9 rounded-2xl bg-background text-center" aria-invalid={!!productError?.quantity} {...form.register(`products.${index}.quantity` as const, { valueAsNumber: true })} />
                          <FieldError errors={[productError?.quantity]} />
                        </Field>
                      </div>
                      <div className="md:col-span-3">
                        <Field data-invalid={!!productError?.price}>
                          <FieldLabel className="text-[10px] font-bold uppercase text-muted-foreground">Price</FieldLabel>
                          <Input type="number" className="h-9 rounded-2xl bg-background" aria-invalid={!!productError?.price} {...form.register(`products.${index}.price` as const, { valueAsNumber: true })} />
                          <FieldError errors={[productError?.price]} />
                        </Field>
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="text-destructive h-9 w-9 hover:bg-destructive/10" onClick={() => remove(index)}>
                            <HugeiconsIcon icon={Cancel01Icon} size={18} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {errors.products?.root && <FieldError errors={[errors.products.root]} />}
            </div>
          </div>
        );
      case 6:
        const values = form.getValues();
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Review Order</h2>
              <p className="text-sm text-muted-foreground">Verify your order details before finalization</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-none border bg-muted/10">
                <CardHeader className="py-4"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service Info</CardTitle></CardHeader>
                <CardContent className="space-y-2 py-0 pb-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type</span><span className="font-semibold">{values.order_type}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Weight</span><span className="font-semibold">{values.weight} KG</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="font-semibold">{values.payment_mode}</span></div>
                </CardContent>
              </Card>
              <Card className="shadow-none border bg-primary/5 border-primary/20">
                <CardHeader className="py-4"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">Total Amount</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-0 pb-4">
                  <span className="text-3xl font-bold tracking-tight">₹{values.total_amount}</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase mt-1">Inclusive of all fees</span>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-muted/20 text-sm">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Origin</p>
                <p className="font-semibold">{values.pickup_address.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{values.pickup_address.address}, {values.pickup_address.city}</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/20 text-sm">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Destination</p>
                <p className="font-semibold">{values.receiver_address.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{values.receiver_address.address}, {values.receiver_address.city}</p>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary border border-primary/20">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Ready to Create Order</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Click below to finalize and create your shipping label.</p>
              <div className="pt-6 border-t mt-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Order Value</p>
                <p className="text-4xl font-bold tracking-tight">₹{form.getValues("total_amount")}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
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
              <div key={step.id} className="flex flex-col items-center gap-2 rounded-2xl">
                <div 
                  className={cn(
                    "w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 border",
                    isActive ? "bg-primary text-primary-foreground border-primary shadow-sm scale-110" : 
                    isCompleted ? "bg-primary text-primary-foreground border-primary" : 
                    "bg-background text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon icon={Icon} size={16} />
                </div>
                <span className={cn(
                  "text-[9px] font-bold rounded-2xl uppercase tracking-widest hidden md:block",
                  isActive ? "text-primary" : "text-muted-foreground/60"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden border shadow-sm rounded-2xl" >
        <CardContent className="p-8 md:p-12">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {renderStepContent()}

            <div className="flex justify-between pt-8 border-t ">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1 || isPending}
                className={cn(
                  "h-10 px-6  font-medium gap-2 rounded-2xl",
                  currentStep === 1 ? "invisible" : "flex"
                )}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Back
              </Button>
              
              {currentStep < steps.length ? (
                <Button 
                  type="button" 
                  className="h-10 px-8 font-medium text-sm gap-2 transition-all hover:scale-[1.01] rounded-2xl" 
                  onClick={nextStep}
                >
                  Continue <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isPending} 
                  className="h-10 px-8 font-medium text-sm gap-2 bg-primary transition-all hover:scale-[1.01] rounded-2xl"
                >
                  {isPending ? "Creating..." : "Finalize Order"}
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