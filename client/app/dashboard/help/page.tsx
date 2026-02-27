import HelpPage from "./help-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support",
  description: "Get assistance and answers to your questions.",
};

export default function Page() {
  return <HelpPage />;
}
