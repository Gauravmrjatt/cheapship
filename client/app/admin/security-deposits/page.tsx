import SecurityDepositsAdminContent from "./security-deposits-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Deposits - Admin",
  description: "View and manage all user security deposits",
};

export default function Page() {
  return <SecurityDepositsAdminContent />;
}