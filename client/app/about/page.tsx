import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Cashbackwallah - India's smartest shipping and logistics platform. We help businesses compare rates, book shipments, and track deliveries.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">About Cashbackwallah</h1>
      <div className="prose prose-gray max-w-none space-y-6">
        <p className="text-lg text-muted-foreground">
          Cashbackwallah is India&apos;s smartest shipping platform. We empower businesses of all sizes to
          compare shipping rates from 25+ carriers, book shipments, and track deliveries—all from a single dashboard.
        </p>

        <h2 className="text-2xl font-semibold mt-10">Our Mission</h2>
        <p className="text-muted-foreground">
          We believe shipping should be simple, transparent, and affordable. Our platform levels the playing field,
          giving small businesses access to enterprise-grade logistics tools and carrier rates.
        </p>

        <h2 className="text-2xl font-semibold mt-10">Why Cashbackwallah?</h2>
        <ul className="space-y-3 text-muted-foreground list-disc pl-6">
          <li>Compare real-time rates from 25+ leading carriers across India</li>
          <li>Save up to 40% on shipping costs with negotiated carrier rates</li>
          <li>Track all your shipments from a single dashboard</li>
          <li>Integrated with major e-commerce platforms</li>
          <li>Pan India coverage to over 27,000 pin codes</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10">Our Story</h2>
        <p className="text-muted-foreground">
          Founded with the vision of making shipping accessible to every business in India, Cashbackwallah has
          grown to serve 50,000+ active users and has delivered over 2 million shipments. We are headquartered
          in Jaipur, Rajasthan, and serve businesses across the country.
        </p>

        <h2 className="text-2xl font-semibold mt-10">Our Team</h2>
        <p className="text-muted-foreground">
          Our team brings together expertise in logistics, technology, and customer service. We are passionate
          about solving the complex challenges of Indian logistics and making shipping a growth driver for businesses.
        </p>
      </div>
    </div>
  );
}
