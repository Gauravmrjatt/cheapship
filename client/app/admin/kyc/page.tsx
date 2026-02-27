import KYCPage from "./kyc-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYC Management",
  description: "Review and manage user KYC submissions and verification status.",
};

export default function Page() {
  return <KYCPage />;
}
