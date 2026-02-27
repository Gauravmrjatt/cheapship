import OrdersPage from "./orders-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage and track all your shipments in one place.",
};

export default function Page() {
  return <OrdersPage />;
}
