import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RateCalculatorData {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  paymentType: "PREPAID" | "COD";
  shipmentValue: number;
  order_type: "SURFACE" | "EXPRESS";
  selectedCourier: {
    courier_company_id: number;
    courier_name: string;
    rate: number;
    mode: string;
    rating: number;
    estimated_delivery: string;
    delivery_in_days: string;
    chargeable_weight: number;
  } | null;
}

interface RateCalculatorState {
  data: RateCalculatorData | null;
  setRateData: (data: RateCalculatorData) => void;
  clearRateData: () => void;
}

export const useRateCalculatorStore = create<RateCalculatorState>()(
  persist(
    (set) => ({
      data: null,
      setRateData: (data) => set({ data }),
      clearRateData: () => set({ data: null }),
    }),
    {
      name: "rate-calculator-storage",
    }
  )
);
