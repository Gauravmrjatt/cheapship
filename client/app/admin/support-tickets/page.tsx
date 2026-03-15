import SupportTicketsPage from "./support-tickets-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Tickets",
  description: "Manage and respond to support tickets from users",
};

export default function Page() {
  return <SupportTicketsPage />;
}