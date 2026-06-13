import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });
import CommandPalette from "@/components/command-palette";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Providers from "./providers";
import { Toaster } from "sileo";
import { ThemeProvider } from "./theme-provider";
import { PwaBanners } from "@/components/ui/pwa-banners";

const baseUrl = "https://cashbackwallah.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  manifest: "/manifest.json",
  title: {
    template: "%s | Cashbackwallah",
    default: "Cashbackwallah - Shipping and Logistics Solutions",
  },
  description: "Efficient and affordable shipping and logistics management for businesses.",
  openGraph: {
    title: "Cashbackwallah - Shipping and Logistics Solutions",
    description: "Efficient and affordable shipping and logistics management for businesses.",
    url: baseUrl,
    siteName: "Cashbackwallah",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/logo.jpg", width: 400, height: 400 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cashbackwallah - Shipping and Logistics Solutions",
    description: "Efficient and affordable shipping and logistics management for businesses.",
    images: ["/logo.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cashbackwallah",
  },
};

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
              <PwaBanners />
              <Toaster options={{
                fill: "#171717",
                styles: { description: "text-white/75!" },
              }} position="top-center" />
              <Script
                id="schema-org"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    name: "Cashbackwallah",
                    url: "https://cashbackwallah.com",
                    logo: "https://cashbackwallah.com/logo.jpg",
                    description: "Efficient and affordable shipping and logistics management for businesses.",
                    telephone: ["+919509698208", "+916377860521"],
                    contactPoint: [
                      { "@type": "ContactPoint", telephone: "+919509698208", contactType: "customer service" },
                      { "@type": "ContactPoint", telephone: "+916377860521", contactType: "customer service" },
                    ],
                    address: {
                      "@type": "PostalAddress",
                      streetAddress: "House no 104, Amba Wadi",
                      addressLocality: "Jaipur",
                      addressRegion: "Rajasthan",
                      postalCode: "302013",
                      addressCountry: "IN",
                    },
                  }),
                }}
              />
              {children}
              <CommandPalette />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
