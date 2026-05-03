"use client";

import { useEffect, useState } from "react";
import { Command, X, Minus } from "lucide-react";
import { Button } from "./button";

const STORAGE_KEY = "kbar-prompt-shown";
const IS_DESKTOP_THRESHOLD = 768;

export function KBarPrompt() {
  const [show, setShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= IS_DESKTOP_THRESHOLD);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const hasShown = localStorage.getItem(STORAGE_KEY) === "true";
    if (hasShown) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isDesktop]);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!show || !isDesktop) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md mx-4 rounded-xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Command className="h-6 w-6 text-primary" />
          </div>

          <h3 className="mb-2 text-lg font-semibold">Pro Tip</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Press <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-xs font-medium">⌘ K</kbd> on Mac or{" "}
            <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-xs font-medium">Ctrl K</kbd> on Windows to open the command palette for quick actions.
          </p>

          <Button onClick={handleDismiss} className="w-full">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}