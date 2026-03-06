import WeightDisputesContent from "./weight-disputes-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weight Disputes",
  description: "Manage weight disputes for orders",
};

export default function Page() {
  return <WeightDisputesContent />;
}
