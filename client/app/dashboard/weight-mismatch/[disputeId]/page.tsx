import WeightDisputeDetails from "./weight-dispute-details";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weight Dispute Details",
  description: "View details of your weight dispute request.",
};

export default function WeightDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  return <WeightDisputeDetails params={params} />;
}
