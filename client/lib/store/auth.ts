import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  mobile?: string;
  wallet_balance?: number;
  user_type?: string;
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
      name: "auth-storage", // name of the item in the storage (must be unique)
    }
  )
);