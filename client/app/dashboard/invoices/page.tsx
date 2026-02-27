import InvoicesPage from "./invoices-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices",
  description: "View and download your shipping invoices.",
};

export default function Page() {
  return <InvoicesPage />;
}
