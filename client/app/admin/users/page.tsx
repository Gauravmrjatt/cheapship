import UsersPage from "./users-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Users",
  description: "Administrative tools for managing Cashbackwallah users and their permissions.",
};

export default function Page() {
  return <UsersPage />;
}
