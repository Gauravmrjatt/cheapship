import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";


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

export const metadata: Metadata = {
  title: {
    template: "%s | CheapShip",
    default: "CheapShip - Shipping and Logistics Solutions",
  },
  description: "Efficient and affordable shipping and logistics management for businesses.",
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
          
              <Toaster options={{
                fill: "#171717",
                styles: { description: "text-white/75!" },
              }} position="top-center" />
              {children}
              <CommandPalette />
         
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
