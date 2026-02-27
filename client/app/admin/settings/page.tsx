import AdminSettingsPage from "./settings-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Settings",
  description: "Platform-wide administrative settings and configurations.",
};

export default function Page() {
  return <AdminSettingsPage />;
}
