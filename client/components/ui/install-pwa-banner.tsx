"use client";

import { useEffect, useState, useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "./button";
import {
  Cancel01Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from 'next/image'
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    mounted.current = true;

    const dismissedState = localStorage.getItem("pwa-install-dismissed");
    if (dismissedState === "true") {
      setDismissed(true);
    }

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => {
        if (mounted.current && !dismissedState) {
          setShow(true);
        }
      }, 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!show || isInstalled) return null;

  return (
    <div
      className="fixed bottom-2 left-1 md:left-auto right-1 flex items-center justify-between  bg-background z-40 p-3 pt-0 shadow-md rounded-full border max-w-2xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-3 m-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5223A5]">
          <Download className="h-5 w-5 text-white" />
          <Image src="/logo.jpg"
          className="rounded-3xl"
            width={500}
            height={500}
            alt="Picture of the author" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Install Cashbackwallah App
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Add to home screen for offline access
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">

        <Button size="lg" onClick={handleInstall}>
          Install
        </Button>
        <Button size="icon" variant="ghost" onClick={handleDismiss}>
          <HugeiconsIcon icon={Cancel01Icon} />
        </Button>
      </div>
    </div>
  );
}