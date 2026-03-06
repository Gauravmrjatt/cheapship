import Rtocontent from "./rto-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RTO Management",
  description: "Manage RTO charges for orders",
};

export default function Page() {
  return <Rtocontent />;
}
