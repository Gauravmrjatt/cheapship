import { z } from "zod";

export const franchiseSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  type: z.enum(["DIRECT_SELLER", "DISTRIBUTOR", "PARTNER"], {
    required_error: "Franchise type is required",
  }),
  address: z.string().min(1, "Complete address is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

export type Franchise = z.infer<typeof franchiseSchema> & { id: string };