import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Cashbackwallah. Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

      <div className="prose prose-gray max-w-none space-y-6">
        <h2 className="text-2xl font-semibold mt-8">1. Information We Collect</h2>
        <p className="text-muted-foreground">
          We collect information you provide when creating an account, including your name, email address,
          phone number, and business details. We also collect shipping-related data necessary to process
          your shipments.
        </p>

        <h2 className="text-2xl font-semibold mt-8">2. How We Use Your Information</h2>
        <p className="text-muted-foreground">
          We use your information to provide and improve our shipping services, process transactions,
          communicate with you about your shipments, and send relevant updates about our platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8">3. Data Security</h2>
        <p className="text-muted-foreground">
          We implement industry-standard security measures to protect your personal information. However,
          no method of transmission over the Internet is 100% secure.
        </p>

        <h2 className="text-2xl font-semibold mt-8">4. Third-Party Sharing</h2>
        <p className="text-muted-foreground">
          We share necessary information with shipping carriers to fulfill your shipments. We do not sell
          your personal information to third parties.
        </p>

        <h2 className="text-2xl font-semibold mt-8">5. Cookies</h2>
        <p className="text-muted-foreground">
          We use cookies and similar technologies to enhance your experience, analyze usage patterns, and
          provide essential platform functionality.
        </p>

        <h2 className="text-2xl font-semibold mt-8">6. Your Rights</h2>
        <p className="text-muted-foreground">
          You have the right to access, correct, or delete your personal information. You can manage your
          account settings or contact us to exercise these rights.
        </p>

        <h2 className="text-2xl font-semibold mt-8">7. Contact</h2>
        <p className="text-muted-foreground">
          For privacy-related inquiries, please contact us at +91 9509698208.
        </p>
      </div>
    </div>
  );
}
