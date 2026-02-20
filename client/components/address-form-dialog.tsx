"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FloppyDiskIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

const addressFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  complete_address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be at least 6 characters"),
  country: z.string().default("India"),
  address_label: z.string().optional(),
  is_default: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressFormSchema>;

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
  country?: string;
}

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAddress: SavedAddress | null;
  onSubmit: (data: AddressFormData) => void;
  isPending: boolean;
}

export function AddressFormDialog({
  open,
  onOpenChange,
  editingAddress,
  onSubmit,
  isPending,
}: AddressFormDialogProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      complete_address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      address_label: "",
      is_default: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (editingAddress) {
        form.reset({
          name: editingAddress.name,
          phone: editingAddress.phone,
          email: editingAddress.email || "",
          complete_address: editingAddress.complete_address,
          city: editingAddress.city,
          state: editingAddress.state,
          pincode: editingAddress.pincode,
          country: editingAddress.country || "India",
          address_label: editingAddress.address_label || "",
          is_default: editingAddress.is_default,
        });
      } else {
        form.reset({
          name: "",
          phone: "",
          email: "",
          complete_address: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          address_label: "",
          is_default: false,
        });
      }
    }
  }, [open, editingAddress, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingAddress ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription>
            {editingAddress
              ? "Update the address details below."
              : "Enter the details for your new saved address."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel className="text-xs">Contact Name</FieldLabel>
              <Input {...form.register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel className="text-xs">Phone Number</FieldLabel>
              <Input {...form.register("phone")} />
              <FieldError errors={[errors.phone]} />
            </Field>
          </div>
          <Field data-invalid={!!errors.email}>
            <FieldLabel className="text-xs">Email Address</FieldLabel>
            <Input {...form.register("email")} />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={!!errors.complete_address}>
            <FieldLabel className="text-xs">Complete Address</FieldLabel>
            <Input
              {...form.register("complete_address")}
              placeholder="House/Flat No, Building, Street, Area"
            />
            <FieldError errors={[errors.complete_address]} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.city}>
              <FieldLabel className="text-xs">City</FieldLabel>
              <Input {...form.register("city")} />
              <FieldError errors={[errors.city]} />
            </Field>
            <Field data-invalid={!!errors.state}>
              <FieldLabel className="text-xs">State</FieldLabel>
              <Input {...form.register("state")} />
              <FieldError errors={[errors.state]} />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.pincode}>
              <FieldLabel className="text-xs">Pincode</FieldLabel>
              <Input {...form.register("pincode")} />
              <FieldError errors={[errors.pincode]} />
            </Field>
            <Field data-invalid={!!errors.country}>
              <FieldLabel className="text-xs">Country</FieldLabel>
              <Input {...form.register("country")} defaultValue="India" />
              <FieldError errors={[errors.country]} />
            </Field>
          </div>
          <Field data-invalid={!!errors.address_label}>
            <FieldLabel className="text-xs">Label (Optional)</FieldLabel>
            <Input
              {...form.register("address_label")}
              placeholder="e.g. Home, Office, Warehouse"
            />
            <FieldError errors={[errors.address_label]} />
          </Field>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={16} />
              ) : (
                <HugeiconsIcon icon={FloppyDiskIcon} size={16} />
              )}
              {editingAddress ? "Update Address" : "Save Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const pickupAddressSchema = z.object({
  pickup_location: z.string().min(1, "Location name is required").max(36, "Max 36 characters"),
  name: z.string().min(1, "Contact name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  address: z.string()
    .min(10, "Address must be at least 10 characters")
    .regex(/.*[0-9].*/, "Address must include a House, Flat, or Road number"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pin_code: z.string().min(6, "Pincode must be 6 digits"),
  country: z.string().default("India"),
});

export type PickupAddressFormData = z.infer<typeof pickupAddressSchema>;

interface PickupAddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PickupAddressFormData) => void;
  isPending: boolean;
}

export function PickupAddressFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: PickupAddressFormDialogProps) {
  const form = useForm<PickupAddressFormData>({
    resolver: zodResolver(pickupAddressSchema) as any,
    defaultValues: {
      pickup_location: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pin_code: "",
      country: "India",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register Pickup Location</DialogTitle>
          <DialogDescription>
            Create a new pickup location with Shiprocket for order pickups.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field data-invalid={!!errors.pickup_location}>
            <FieldLabel className="text-xs">Location Nickname</FieldLabel>
            <Input
              {...form.register("pickup_location")}
              placeholder="e.g. Warehouse-1"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              A unique identifier for this pickup location (max 36 chars)
            </p>
            <FieldError errors={[errors.pickup_location]} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel className="text-xs">Contact Name</FieldLabel>
              <Input {...form.register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel className="text-xs">Phone Number</FieldLabel>
              <Input {...form.register("phone")} />
              <FieldError errors={[errors.phone]} />
            </Field>
          </div>
          <Field data-invalid={!!errors.email}>
            <FieldLabel className="text-xs">Email Address</FieldLabel>
            <Input {...form.register("email")} />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={!!errors.address}>
            <FieldLabel className="text-xs">Full Address</FieldLabel>
            <Input
              {...form.register("address")}
              placeholder="Include House/Flat No, Building, Road etc."
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Min 10 chars. Must include House/Flat/Road No.
            </p>
            <FieldError errors={[errors.address]} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.city}>
              <FieldLabel className="text-xs">City</FieldLabel>
              <Input {...form.register("city")} />
              <FieldError errors={[errors.city]} />
            </Field>
            <Field data-invalid={!!errors.state}>
              <FieldLabel className="text-xs">State</FieldLabel>
              <Input {...form.register("state")} />
              <FieldError errors={[errors.state]} />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.pin_code}>
              <FieldLabel className="text-xs">Pincode</FieldLabel>
              <Input {...form.register("pin_code")} />
              <FieldError errors={[errors.pin_code]} />
            </Field>
            <Field data-invalid={!!errors.country}>
              <FieldLabel className="text-xs">Country</FieldLabel>
              <Input {...form.register("country")} defaultValue="India" />
              <FieldError errors={[errors.country]} />
            </Field>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={16} />
              ) : (
                <HugeiconsIcon icon={FloppyDiskIcon} size={16} />
              )}
              Register Location
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
