import RTODisputeDetails from "./rto-details";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RTO Details",
  description: "View details of your RTO request.",
};

export default function RTODisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  return <RTODisputeDetails params={params} />;
}
