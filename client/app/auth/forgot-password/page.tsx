import ForgotPasswordPage from "./forgot-password-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your CheapShip account password.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
