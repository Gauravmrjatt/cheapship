import SecurityDepositsContent from "./security-deposits-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Security Deposits",
  description: "View your security deposit history and remaining amounts",
};

export default function Page() {
  return <SecurityDepositsContent />;
}