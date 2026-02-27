import ForgotPasswordPage from "./forgot-password-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Admin",
  description: "Reset your administrator account password.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
