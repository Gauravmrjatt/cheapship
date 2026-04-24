import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  mobile?: string;
  wallet_balance?: number;
  security_deposit?: number;
  user_type?: string;
  is_active?: boolean;
  min_commission_rate?: string;
  max_commission_rate?: string;
  assigned_rates?: Record<string, { rate: number; slab: number }>;
  kyc_status?: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
  upi_id?: string;
  bank_name?: string;
  beneficiary_name?: string;
  account_number?: string;
  ifsc_code?: string;
  _count?: {
    orders: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
    }),
    {
      name: "auth-storage",
    }
  )
);