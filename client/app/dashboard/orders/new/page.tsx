import NewOrderPage from "./new-order-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Order",
  description: "Set up a new shipment and book it with your preferred carrier.",
};

export default function Page() {
  return <NewOrderPage />;
}
