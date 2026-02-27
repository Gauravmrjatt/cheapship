import { Suspense } from "react";
import SignUpForm from "./signup-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | CheapShip",
  description: "Create a new CheapShip account",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><HugeiconsIcon icon={Loading03Icon} className="animate-spin" /></div>}>
      <SignUpForm />
    </Suspense>
  );
}
