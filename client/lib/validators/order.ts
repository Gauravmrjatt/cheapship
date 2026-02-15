import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be at least 6 characters"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(1, "Price must be at least 1"),
});

export const calculateRateSchema = z.object({
  pickupPincode: z.string().min(6, "Pickup pincode is required"),
  deliveryPincode: z.string().min(6, "Delivery pincode is required"),
  actualWeight: z.coerce.number().min(0.1, "Weight must be at least 0.1kg"),
  length: z.coerce.number().min(1, "Length is required"),
  width: z.coerce.number().min(1, "Width is required"),
  height: z.coerce.number().min(1, "Height is required"),
  paymentType: z.enum(["PREPAID", "COD"]),
  shipmentValue: z.coerce.number().min(1, "Value is required"),
  dangerousGoods: z.boolean().default(false),
});

export const createOrderSchema = z.object({
  order_type: z.enum(["SURFACE", "EXPRESS"]),
  shipment_type: z.enum(["DOMESTIC", "INTERNATIONAL"]),
  payment_mode: z.enum(["PREPAID", "COD"]),
  weight: z.coerce.number().min(0.1, "Weight is required"),
  length: z.coerce.number().min(1, "Length is required"),
  width: z.coerce.number().min(1, "Width is required"),
  height: z.coerce.number().min(1, "Height is required"),
  total_amount: z.coerce.number().min(1, "Total amount is required"),
  pickup_location: z.string().min(1, "Pickup location is required"),
  pickup_address: addressSchema,
  receiver_address: addressSchema,
  products: z.array(productSchema).min(1, "At least one product is required"),
  save_pickup_address: z.boolean().default(false),
  save_receiver_address: z.boolean().default(false),
  courier_id: z.number().optional(),
  courier_name: z.string().optional(),
  shipping_charge: z.number().optional(),
  base_shipping_charge: z.number().optional(),
});

export const shiprocketPickupSchema = z.object({
  pickup_location: z.string().min(1, "Nickname is required").max(36, "Max 36 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string()
    .min(10, "Address must be at least 10 characters")
    .regex(/.*[0-9].*/, "Address must include a House, Flat, or Road number"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits"),
  country: z.string().default("India"),
});
