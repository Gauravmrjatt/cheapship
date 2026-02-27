import PaymentsPage from "./payments-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments",
  description: "Manage your wallet, transactions, and payment history.",
};

export default function Page() {
  return <PaymentsPage />;
}
