import WalletWithdrawalsContent from "./wallet-withdrawals-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet Withdrawals - Admin",
  description: "Manage wallet withdrawal requests",
};

export default function Page() {
  return <WalletWithdrawalsContent />;
}