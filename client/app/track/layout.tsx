import { Metadata } from "next";
import { PublicHeader, PublicFooter } from "@/components/public-layout";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Track Your Shipment",
  description:
    "Track your shipment in real-time. Enter your AWB number to get live updates on your delivery status with Cashbackwallah.",
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}