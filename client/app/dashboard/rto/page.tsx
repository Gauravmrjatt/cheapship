import Rtocontent from "./rto-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RTO",
  description: "View your RTO (Return to Origin) history",
};

export default function Page() {
  return <Rtocontent />;
}
