import { Metadata } from "next";
import { CalculatorContent } from "./calculator-content";

export const metadata: Metadata = {
  title: "Shipping Rate Calculator",
  description:
    "Compare shipping rates from 25+ carriers in seconds. Get the best prices for your shipments across India with Cashbackwallah's free rate calculator.",
};

export default function RateCalculatorPage() {
  return <CalculatorContent />;
}