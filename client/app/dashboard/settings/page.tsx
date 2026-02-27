import SettingsPage from "./settings-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure your account settings and preferences.",
};

export default function Page() {
  return <SettingsPage />;
}
