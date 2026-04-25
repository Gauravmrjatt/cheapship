"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CallIcon } from "@hugeicons/core-free-icons";

export function PublicHeader() {
  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-white p-0.5 rounded-xl">
            <Image
              src="/logoo.png"
              alt="logoo"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
          <span className="text-xl font-bold hidden md:block">Cashbackwallah</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/rate-calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Rate Calculator
          </Link>
          <Link href="/track" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Track Order
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 hidden md:flex">
            <a href="tel:+919509698208" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <HugeiconsIcon icon={CallIcon} size={14} className="text-green-500" />
              <span className="hidden sm:inline">9509698208</span>
            </a>
            <span className="text-muted-foreground/30 hidden sm:inline">|</span>
            <a href="tel:+919251220521" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <span className="hidden sm:inline">9251220521</span>
            </a>
          </div>
          <Link href="/auth/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/fav.jpg"
                alt="Cashbackwallah"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold">Cashbackwallah</span>
            </div>
            <p className="text-sm text-muted-foreground">
              India's smartest shipping platform. Compare rates, book shipments, and track deliveries—all in one place.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/rate-calculator" className="hover:text-foreground">Rate Calculator</Link></li>
              <li><Link href="/track" className="hover:text-foreground">Track Order</Link></li>
              <li><Link href="/auth/signup" className="hover:text-foreground">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
              <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="tel:+919509698208" className="hover:text-foreground">+91 9509698208</a></li>
              <li><a href="tel:+919251220521" className="hover:text-foreground">+91 9251220521</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Cashbackwallah. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}