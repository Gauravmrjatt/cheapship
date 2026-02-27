import WithdrawalsPage from "./withdrawals-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Withdrawal Requests",
  description: "Process and manage user withdrawal requests.",
};

export default function Page() {
  return <WithdrawalsPage />;
}
