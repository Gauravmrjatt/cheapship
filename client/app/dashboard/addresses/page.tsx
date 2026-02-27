import AddressesPage from "./addresses-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Addresses",
  description: "Manage your pickup and delivery address book.",
};

export default function Page() {
  return <AddressesPage />;
}
