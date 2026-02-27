import CalculatorPage from "./calculator-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rate Calculator",
  description: "Calculate shipping rates and compare prices from multiple carriers.",
};

export default function Page() {
  return <CalculatorPage />;
}
