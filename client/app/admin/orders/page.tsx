import OrdersPage from "./orders-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Orders",
  description: "View and manage all shipments across the platform.",
};

export default function Page() {
  return <OrdersPage />;
}
