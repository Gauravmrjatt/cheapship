import { Suspense } from "react";
import SignInForm from "./signin-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | CheapShip",
  description: "Sign in to your CheapShip account",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><HugeiconsIcon icon={Loading03Icon} className="animate-spin" /></div>}>
      <SignInForm />
    </Suspense>
  );
}
