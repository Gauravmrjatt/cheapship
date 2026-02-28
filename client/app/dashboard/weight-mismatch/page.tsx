import WeightMismatchContent from "./weight-mismatch-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weight Dispute",
  description: "Raise a dispute for incorrect shipment weight charges.",
};

export default function WeightMismatchPage() {
  return <WeightMismatchContent />;
}
