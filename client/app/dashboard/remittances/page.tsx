import RemittancesPage from "./remittances-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remittances",
  description: "Track and manage your COD remittance status.",
};

export default function Page() {
  return <RemittancesPage />;
}
