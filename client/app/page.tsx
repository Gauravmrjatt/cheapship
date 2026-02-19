import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TruckIcon,
  ShieldIcon,
  TimerIcon,
  MoneyExchangeIcon,
  Package01Icon,
  Search01Icon,
  CheckmarkCircle01Icon,
  DeliveryTruck01Icon,
  StarIcon,
  QuoteDownIcon,
  Location01Icon,
  HeadphonesIcon,
  Wallet01Icon,
  CustomerSupportIcon,
  ArrowRight01Icon,
  FileVerifiedIcon,
  Home01Icon,
  Building02Icon,
  Store01Icon,
  // FlashIcon
} from "@hugeicons/core-free-icons";

const features = [
  {
    icon: MoneyExchangeIcon,
    title: "Best Rates",
    description: "Compare prices from top carriers to find the lowest shipping rates.",
  },
  {
    icon: ShieldIcon,
    title: "Secure",
    description: "Your packages are insured and protected from pickup to delivery.",
  },
  {
    icon: TimerIcon,
    title: "Fast Delivery",
    description: "Choose from express or standard shipping options that fit your timeline.",
  },
  {
    icon: TruckIcon,
    title: "Track Everything",
    description: "Real-time tracking updates on all your shipments in one place.",
  },
];

const steps = [
  {
    icon: Search01Icon,
    step: "01",
    title: "Compare Rates",
    description: "Enter your shipment details and instantly compare rates from multiple carriers.",
  },
  {
    icon: Package01Icon,
    step: "02",
    title: "Book Shipment",
    description: "Select the best option and book your shipment in just a few clicks.",
  },
  {
    icon: DeliveryTruck01Icon,
    step: "03",
    title: "Track & Deliver",
    description: "Track your package in real-time until it reaches its destination.",
  },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "E-commerce Owner",
    company: "TechGadgets India",
    content: "CheapShip has reduced our shipping costs by 35%. The rate calculator is a game-changer for our business.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Operations Manager",
    company: "FashionHub",
    content: "The dashboard is intuitive and the multi-carrier comparison saves us hours every week. Highly recommended!",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "Small Business Owner",
    company: "HandCrafts Co.",
    content: "Finally, a shipping platform that doesn&apos;t require a PhD to use. Simple, affordable, and reliable.",
    rating: 5,
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for small businesses just getting started",
    features: [
      "Up to 50 shipments/month",
      "3 carrier partners",
      "Basic tracking",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Business",
    price: "₹999",
    period: "/month",
    description: "For growing businesses with regular shipping needs",
    features: [
      "Unlimited shipments",
      "All carrier partners",
      "Advanced analytics",
      "Priority support",
      "Bulk shipping tools",
      "API access",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large-scale operations with custom requirements",
    features: [
      "Everything in Business",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "Volume discounts",
      "White-label options",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "2M+", label: "Shipments Delivered" },
  { value: "25+", label: "Carrier Partners" },
  { value: "99.8%", label: "Success Rate" },
];

const partners = [
  "Delhivery",
  "Blue Dart",
  "FedEx",
  "DHL",
  "Ecom Express",
  "Shadowfax",
  "XpressBees",
  "India Post",
];

const faqs = [
  {
    question: "How does CheapShip work?",
    answer: "CheapShip aggregates shipping rates from multiple carriers. Enter your shipment details, compare rates in real-time, and book with your preferred carrier.",
  },
  {
    question: "Is there a minimum shipping volume?",
    answer: "No minimum volume required. Ship as little or as much as you need. Our Starter plan is free for up to 50 shipments per month.",
  },
  {
    question: "Can I track my shipments?",
    answer: "Yes! All shipments include real-time tracking. You&apos;ll receive updates at every stage - from pickup to delivery.",
  },
  {
    question: "Do you offer cash on delivery (COD)?",
    answer: "Yes, we support COD services with multiple carriers. The COD amount is securely transferred to your account after delivery.",
  },
  {
    question: "What areas do you service?",
    answer: "We cover 27,000+ pin codes across India, including metro cities, tier-2 cities, and remote locations.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <HugeiconsIcon icon={TruckIcon} size={24} className="text-primary" />
            </div>
            <span className="text-xl font-bold">CheapShip</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="hidden sm:block">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/20 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
            {/* <FlashIcon className="w-3 h-3 mr-1" /> */}
              Now serving 27,000+ pin codes
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Ship Smarter,
              <span className="text-primary"> Save Bigger</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Compare shipping rates from 25+ carriers in seconds. Save up to 40% on every shipment with India&apos;s smartest logistics platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8">
                  Start Shipping Free
                  <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2" size={18} />
                </Button>
              </Link>
              <Link href="/dashboard/calculator">
                <Button size="lg" variant="outline" className="h-12 px-8">
                  Calculate Rates
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-500" />
                Free forever plan
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to ship smarter
            </h2>
            <p className="text-muted-foreground">
              Powerful tools designed to streamline your shipping process and reduce costs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <HugeiconsIcon icon={feature.icon} size={24} className="text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ship in 3 simple steps
            </h2>
            <p className="text-muted-foreground">
              Getting started with CheapShip is easy. Ship your first package in minutes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 -translate-y-1/2" />
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="text-center h-full border-border/50 bg-background">
                  <CardHeader>
                    <div className="relative inline-flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <HugeiconsIcon icon={step.icon} size={28} className="text-primary-foreground" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                        {step.step}
                      </div>
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{step.description}</CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Trusted by leading e-commerce businesses
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            {partners.map((partner, index) => (
              <div key={index} className="text-lg font-semibold text-muted-foreground">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {/* <section id="pricing" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground">
              Choose the plan that fits your business. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border/50'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/signup">
                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by businesses across India
            </h2>
            <p className="text-muted-foreground">
              See what our customers have to say about their experience with CheapShip.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50">
                <CardHeader>
                  <HugeiconsIcon icon={QuoteDownIcon} size={32} className="text-primary/40 mb-4" />
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <HugeiconsIcon key={i} icon={StarIcon} size={16} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">&quot;{testimonial.content}&quot;</p>
                  <div className="pt-4 border-t">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm text-primary">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Types */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">For Every Business</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Solutions for every business type
            </h2>
            <p className="text-muted-foreground">
              Whether you&apos;re a small business or an enterprise, we have solutions tailored for you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-border/50">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <HugeiconsIcon icon={Home01Icon} size={32} className="text-primary" />
                </div>
                <CardTitle>Small Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Perfect for home-based businesses and startups. Get access to enterprise-grade shipping at affordable rates.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center border-border/50">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <HugeiconsIcon icon={Store01Icon} size={32} className="text-primary" />
                </div>
                <CardTitle>E-commerce Stores</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Integrate with your online store and automate your shipping. Support for all major platforms.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center border-border/50">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <HugeiconsIcon icon={Building02Icon} size={32} className="text-primary" />
                </div>
                <CardTitle>Enterprises</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Custom solutions for large-scale operations with dedicated support and volume discounts.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground">
              Got questions? We&apos;ve got answers. If you don&apos;t find what you&apos;re looking for, feel free to contact us.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-3">
                    <HugeiconsIcon icon={FileVerifiedIcon} size={20} className="text-primary mt-1 shrink-0" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={HeadphonesIcon} size={28} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">Our team is always here to help you with any questions.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={Wallet01Icon} size={28} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Money Back Guarantee</h3>
              <p className="text-sm text-muted-foreground">Not satisfied? Get a full refund within 30 days.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={Location01Icon} size={28} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Pan India Coverage</h3>
              <p className="text-sm text-muted-foreground">We deliver to 27,000+ pin codes across India.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto text-center p-8 border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Stay Updated</CardTitle>
              <CardDescription>
                Subscribe to our newsletter for shipping tips, updates, and exclusive offers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input placeholder="Enter your email" type="email" className="flex-1" />
                <Button>Subscribe</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to start saving on shipping?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join 50,000+ businesses already using CheapShip to reduce their logistics costs. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="h-12 px-8">
                Create Free Account
              </Button>
            </Link>
            <Link href="/dashboard/calculator">
              <Button size="lg" variant="outline" className="h-12 px-8 border-primary-foreground/20 hover:bg-primary-foreground/10">
                Try Rate Calculator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <HugeiconsIcon icon={TruckIcon} size={20} className="text-primary" />
                </div>
                <span className="text-lg font-bold">CheapShip</span>
              </div>
              <p className="text-sm text-muted-foreground">
                India&apos;s smartest shipping platform. Compare rates, book shipments, and track deliveries—all in one place.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard/calculator" className="hover:text-foreground">Rate Calculator</Link></li>
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground">Refund Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Shipping Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 CheapShip. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
