import AdminDashboard from "./admin-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Cashbackwallah administrative dashboard for managing users, orders, and platform operations.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
