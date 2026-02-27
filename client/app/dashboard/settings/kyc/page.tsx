import KYCPage from "./kyc-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYC Verification",
  description: "Complete your KYC verification to unlock full shipping capabilities.",
};

export default function Page() {
  return <KYCPage />;
}
