import FranchisePage from "./franchise-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Franchise Management",
  description: "View and manage your Cashbackwallah franchise performance and earnings.",
};

export default function Page() {
  return <FranchisePage />;
}
