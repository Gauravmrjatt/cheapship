import DashboardContent from "./dashboard-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your shipping statistics and manage your logistics operations.",
};

export default function Dashboard() {
  return <DashboardContent />;
}
