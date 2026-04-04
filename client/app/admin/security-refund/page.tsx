import SecurityRefundContent from "./security-refund-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Refund Schedule",
  description: "Configure security deposit refund schedule",
};

export default function Page() {
  return <SecurityRefundContent />;
}