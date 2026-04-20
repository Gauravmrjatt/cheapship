import FeedbackPage from "./feedback-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Share your feedback and help us improve Cashbackwallah.",
};

export default function Page() {
  return <FeedbackPage />;
}
