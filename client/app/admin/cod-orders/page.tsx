import CODOrdersPage from "./cod-orders-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "COD Orders",
  description: "Monitor and manage Cash on Delivery orders and statuses.",
};

export default function Page() {
  return <CODOrdersPage />;
}
