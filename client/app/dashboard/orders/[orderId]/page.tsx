import OrderDetailsContent from "./order-details-content";
import { Metadata } from "next";

type Props = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Order #${orderId}`,
    description: `View details for order #${orderId}`,
  };
}

export default function Page({ params }: Props) {
  return <OrderDetailsContent params={params} />;
}
