import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Cashbackwallah. Contact our support team for help with shipping, rate comparison, tracking, and account management.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
      <p className="text-lg text-muted-foreground mb-12">
        Have a question or need help? We&apos;re here for you.
      </p>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Phone Support</h2>
            <p className="text-muted-foreground">
              <a href="tel:+919509698208" className="text-primary hover:underline">
                +91 9509698208
              </a>
            </p>
            <p className="text-muted-foreground">
              <a href="tel:+916377860521" className="text-primary hover:underline">
                +91 6377860521
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Office Address</h2>
            <p className="text-muted-foreground">
              MISW REVALTO LLP
              <br />
              House no 104, Amba Wadi
              <br />
              Jaipur, Rajasthan - 302013
              <br />
              India
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Instagram</h2>
            <p className="text-muted-foreground">
              <a
                href="https://instagram.com/cheapship.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @cheapship.in
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Business Hours</h2>
            <p className="text-muted-foreground">
              Monday - Saturday: 10:00 AM - 7:00 PM
              <br />
              Sunday: Closed
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Support</h2>
            <p className="text-muted-foreground">
              Our support team is available 24/7 to help with any issues you may encounter.
              For the fastest response, please call us during business hours.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">GSTIN</h2>
            <p className="text-muted-foreground">08ACEFM5006E1ZK</p>
          </div>
        </div>
      </div>
    </div>
  );
}
