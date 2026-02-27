import TransactionsPage from "./transactions-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Transactions",
  description: "Monitor and manage financial transactions across the platform.",
};

export default function Page() {
  return <TransactionsPage />;
}
