import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be at least 6 characters"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(1, "Price must be at least 1"),
});

export const calculateRateSchema = z.object({
  pickupPincode: z.string().min(6, "Pickup pincode is required"),
  deliveryPincode: z.string().min(6, "Delivery pincode is required"),
  actualWeight: z.number().min(0.1, "Weight must be at least 0.1kg"),
  length: z.number().min(1, "Length is required"),
  width: z.number().min(1, "Width is required"),
  height: z.number().min(1, "Height is required"),
  paymentType: z.enum(["PREPAID", "COD"]),
  shipmentValue: z.number().min(1, "Value is required"),
  dangerousGoods: z.boolean(),
  order_type: z.enum(["SURFACE", "EXPRESS"]).optional().default("SURFACE"),
});

export const createOrderSchema = z.object({
  order_type: z.enum(["SURFACE", "EXPRESS"]),
  shipment_type: z.enum(["DOMESTIC", "INTERNATIONAL"]),
  payment_mode: z.enum(["PREPAID", "COD"]),
  weight: z.number().min(0.1, "Weight is required"),
  length: z.number().min(1, "Length is required"),
  width: z.number().min(1, "Width is required"),
  height: z.number().min(1, "Height is required"),
  total_amount: z.number().min(1, "Total amount is required"),
  cod_amount: z.number().optional(),
  pickup_location: z.string().min(1, "Pickup location is required"),
  pickup_address: addressSchema,
  receiver_address: addressSchema,
  products: z.array(productSchema).min(1, "At least one product is required"),
  save_pickup_address: z.boolean().optional().default(false),
  save_receiver_address: z.boolean().optional().default(false),
  courier_id: z.number().optional(),
  courier_name: z.string().optional(),
  shipping_charge: z.number().optional(),
  base_shipping_charge: z.number().optional(),
  make_pickup_address: z.boolean().optional().default(false),
  same_as_pickup: z.boolean().optional().default(false),
  new_pickup_location_name: z.string().optional(),
  new_pickup_gst: z.string().optional(),
  new_pickup_registered_name: z.string().optional(),
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
  pin_code: z.string().min(6, "Pincode must be 6 digits"),
  country: z.string(),
});

export const courierRateInputSchema = z.object({
  pickup_pincode: z.string().min(6, "Pickup pincode is required"),
  delivery_pincode: z.string().min(6, "Delivery pincode is required"),
  weight: z.number().min(0.1, "Weight is required"),
  cod: z.boolean(),
  declared_value: z.number().min(1, "Value is required"),
  length: z.number().min(1, "Length is required"),
  width: z.number().min(1, "Width is required"),
  height: z.number().min(1, "Height is required"),
  mode: z.enum(["Surface", "Air"]),
});
