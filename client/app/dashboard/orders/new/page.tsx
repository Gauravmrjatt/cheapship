"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { createOrderSchema } from "@/lib/validators/order";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHttp } from "@/lib/hooks/use-http"; // Import useHttp
import { useMutation } from "@tanstack/react-query";
import { Controller } from "react-hook-form";

export default function CreateOrderPage() {
  const router = useRouter();
  const http = useHttp(); // Initialize useHttp
  const { mutate, isPending } = useMutation<void, Error, z.infer<typeof createOrderSchema>>( // Use http.post
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
    },
  });

  function onSubmit(values: z.infer<typeof createOrderSchema>) {
    mutate(values);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Create Order</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FieldSet>
          <FieldLegend>Order Details</FieldLegend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field>
              <FieldLabel>Order Type</FieldLabel>
              <Controller
                control={form.control}
                name="order_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SURFACE">Surface</SelectItem>
                      <SelectItem value="EXPRESS">Express</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.order_type && (
                <FieldError>{form.formState.errors.order_type.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Shipment Type</FieldLabel>
              <Controller
                control={form.control}
                name="shipment_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shipment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOMESTIC">Domestic</SelectItem>
                      <SelectItem value="INTERNATIONAL">International</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.shipment_type && (
                <FieldError>{form.formState.errors.shipment_type.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Payment Mode</FieldLabel>
              <Controller
                control={form.control}
                name="payment_mode"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREPAID">Prepaid</SelectItem>
                      <SelectItem value="COD">COD</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.payment_mode && (
                <FieldError>{form.formState.errors.payment_mode.message}</FieldError>
              )}
            </Field>
          </div>
          <Field>
            <FieldLabel>Total Amount</FieldLabel>
            <Input
              type="number"
              {...form.register("total_amount")}
            />
            {form.formState.errors.total_amount && (
              <FieldError>{form.formState.errors.total_amount.message}</FieldError>
            )}
          </Field>
        </FieldSet>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FieldSet>
            <FieldLegend>Pickup Address</FieldLegend>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input {...form.register("pickup_address.name")} />
                {form.formState.errors.pickup_address?.name && (
                  <FieldError>{form.formState.errors.pickup_address.name.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input {...form.register("pickup_address.phone")} />
                {form.formState.errors.pickup_address?.phone && (
                  <FieldError>{form.formState.errors.pickup_address.phone.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input {...form.register("pickup_address.email")} />
                {form.formState.errors.pickup_address?.email && (
                  <FieldError>{form.formState.errors.pickup_address.email.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Address</FieldLabel>
                <Input {...form.register("pickup_address.address")} />
                {form.formState.errors.pickup_address?.address && (
                  <FieldError>{form.formState.errors.pickup_address.address.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>City</FieldLabel>
                <Input {...form.register("pickup_address.city")} />
                {form.formState.errors.pickup_address?.city && (
                  <FieldError>{form.formState.errors.pickup_address.city.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>State</FieldLabel>
                <Input {...form.register("pickup_address.state")} />
                {form.formState.errors.pickup_address?.state && (
                  <FieldError>{form.formState.errors.pickup_address.state.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Pincode</FieldLabel>
                <Input {...form.register("pickup_address.pincode")} />
                {form.formState.errors.pickup_address?.pincode && (
                  <FieldError>{form.formState.errors.pickup_address.pincode.message}</FieldError>
                )}
              </Field>
            </div>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Receiver Address</FieldLegend>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input {...form.register("receiver_address.name")} />
                {form.formState.errors.receiver_address?.name && (
                  <FieldError>{form.formState.errors.receiver_address.name.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input {...form.register("receiver_address.phone")} />
                {form.formState.errors.receiver_address?.phone && (
                  <FieldError>{form.formState.errors.receiver_address.phone.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input {...form.register("receiver_address.email")} />
                {form.formState.errors.receiver_address?.email && (
                  <FieldError>{form.formState.errors.receiver_address.email.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Address</FieldLabel>
                <Input {...form.register("receiver_address.address")} />
                {form.formState.errors.receiver_address?.address && (
                  <FieldError>{form.formState.errors.receiver_address.address.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>City</FieldLabel>
                <Input {...form.register("receiver_address.city")} />
                {form.formState.errors.receiver_address?.city && (
                  <FieldError>{form.formState.errors.receiver_address.city.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>State</FieldLabel>
                <Input {...form.register("receiver_address.state")} />
                {form.formState.errors.receiver_address?.state && (
                  <FieldError>{form.formState.errors.receiver_address.state.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Pincode</FieldLabel>
                <Input {...form.register("receiver_address.pincode")} />
                {form.formState.errors.receiver_address?.pincode && (
                  <FieldError>{form.formState.errors.receiver_address.pincode.message}</FieldError>
                )}
              </Field>
            </div>
          </FieldSet>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating Order..." : "Create Order"}
        </Button>
      </form>
    </div>
  );
}