import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be at least 6 characters"),
});

export const createOrderSchema = z.object({
  order_type: z.enum(["SURFACE", "EXPRESS"]),
  shipment_type: z.enum(["DOMESTIC", "INTERNATIONAL"]),
  payment_mode: z.enum(["PREPAID", "COD"]),
  total_amount: z.coerce.number().min(1, "Total amount is required"),
  pickup_address: addressSchema,
  receiver_address: addressSchema,
});
