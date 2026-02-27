import FeedbackPage from "./feedback-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Share your feedback and help us improve CheapShip.",
};

export default function Page() {
  return <FeedbackPage />;
}
