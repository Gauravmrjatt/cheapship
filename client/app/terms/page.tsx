import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Cashbackwallah shipping and logistics platform. Read our terms governing the use of our services.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

      <div className="prose prose-gray max-w-none space-y-6">
        <h2 className="text-2xl font-semibold mt-8">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground">
          By accessing or using Cashbackwallah, you agree to be bound by these Terms of Service. If you do not
          agree, please do not use the platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8">2. Description of Service</h2>
        <p className="text-muted-foreground">
          Cashbackwallah provides a shipping and logistics management platform that allows users to compare
          shipping rates, book shipments, track deliveries, and manage their logistics operations.
        </p>

        <h2 className="text-2xl font-semibold mt-8">3. User Accounts</h2>
        <p className="text-muted-foreground">
          You are responsible for maintaining the confidentiality of your account credentials and for all
          activities that occur under your account. You must provide accurate and complete information when
          creating an account.
        </p>

        <h2 className="text-2xl font-semibold mt-8">4. Use of Services</h2>
        <p className="text-muted-foreground">
          You agree to use the platform only for lawful purposes and in accordance with these terms. You may
          not use the platform for any illegal or unauthorized purpose.
        </p>

        <h2 className="text-2xl font-semibold mt-8">5. Shipping and Logistics</h2>
        <p className="text-muted-foreground">
          Cashbackwallah acts as an intermediary between users and shipping carriers. While we strive to
          provide accurate rates and tracking information, we do not guarantee the performance of third-party
          carriers. All disputes are subject to Haryana Jurisdiction only.
        </p>

        <h2 className="text-2xl font-semibold mt-8">6. Limitation of Liability</h2>
        <p className="text-muted-foreground">
          Cashbackwallah shall not be liable for any indirect, incidental, special, consequential, or punitive
          damages resulting from your use of the platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8">7. Changes to Terms</h2>
        <p className="text-muted-foreground">
          We reserve the right to modify these terms at any time. Users will be notified of significant changes
          via email or platform notification.
        </p>

        <h2 className="text-2xl font-semibold mt-8">8. Contact</h2>
        <p className="text-muted-foreground">
          For questions about these terms, please contact us at +91 9509698208.
        </p>
      </div>
    </div>
  );
}
