import FranchiseSettingsPage from "./settings-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Franchise Settings",
  description: "Manage your franchise account settings and preferences.",
};

export default function Page() {
  return <FranchiseSettingsPage />;
}
