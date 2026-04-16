import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be at least 6 characters"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(1, "Price must be at least 1").max(475000, "Price cannot exceed ₹4,75,000"),
});

export const calculateRateSchema = z.object({
  pickupPincode: z.string().min(6, "Pickup pincode is required"),
  deliveryPincode: z.string().min(6, "Delivery pincode is required"),
  actualWeight: z.number().min(100, "Weight must be at least 100g (0.1kg)").max(1000000, "Weight cannot exceed 1000000g (1000kg)"),
  length: z.number().min(1, "Length is required"),
  width: z.number().min(1, "Width is required"),
  height: z.number().min(1, "Height is required"),
  paymentType: z.enum(["PREPAID", "COD"]),
  shipmentValue: z.number().min(1, "Value is required"),
  dangerousGoods: z.boolean(),
  order_type: z.enum(["SURFACE", "EXPRESS", "CARGO"]),
  is_insured: z.boolean().optional(),
});

const coerceNumber = (val: unknown, fallback = undefined): number | undefined => {
  if (val === "" || val === null || val === undefined) return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

export const createOrderSchema = z.object({
  order_type: z.enum(["SURFACE", "EXPRESS", "CARGO"]),
  shipment_type: z.enum(["DOMESTIC", "INTERNATIONAL"]),
  payment_mode: z.enum(["PREPAID", "COD"]),
  weight: z.coerce.number().min(100, "Weight must be at least 100g").max(1000000, "Weight cannot exceed 1000000g (1000kg)"),
  length: z.coerce.number().min(1, "Length is required"),
  width: z.coerce.number().min(1, "Width is required"),
  height: z.coerce.number().min(1, "Height is required"),
  total_amount: z.number().min(1, "Total amount is required"),
  // COD amount is only required when payment_mode is COD
  cod_amount: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().optional()),
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
  is_insured: z.boolean().optional().default(false),
  is_draft: z.boolean().optional().default(false),
  pickup_pincode : z.string().min(6, "Pickup pincode must be at least 6 characters"),
}).superRefine((data, ctx) => {
  // Validate total_amount max limit
  if (data.total_amount > 475000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Total amount cannot exceed ₹4,75,000",
      path: ["total_amount"],
    });
  }
  // Custom validation: cod_amount is required when payment_mode is COD
  if (data.payment_mode === "COD") {
    if (!data.cod_amount || data.cod_amount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "COD amount is required",
        path: ["cod_amount"],
      });
    } else if (data.cod_amount > 100000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "COD amount cannot exceed 1 lakh",
        path: ["cod_amount"],
      });
    }
  }
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
  gstin: z.string().optional(),
});

export const courierRateInputSchema = z.object({
  pickup_pincode: z.string().min(6, "Pickup pincode is required"),
  delivery_pincode: z.string().min(6, "Delivery pincode is required"),
  weight: z.coerce.number().min(100, "Weight must be at least 100g").max(1000000, "Weight cannot exceed 1000000g (1000kg)"),
  cod: z.boolean(),
  declared_value: z.coerce.number().min(1, "Value is required"),
  length: z.coerce.number().min(1, "Length is required"),
  width: z.coerce.number().min(1, "Width is required"),
  height: z.coerce.number().min(1, "Height is required"),
  mode: z.enum(["Surface", "Air"]),
});
