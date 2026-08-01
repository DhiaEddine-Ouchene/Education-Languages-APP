"use client";

import { useState, useEffect } from "react";
import { Cookie, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const COOKIE_KEY = "eduplay_cookie_consent";

type ConsentState = "accepted" | "declined" | null;

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState | "loading">("loading");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY) as ConsentState | null;
      setConsent(stored ?? null);
    } catch {
      setConsent(null);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setConsent("accepted");
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setConsent("declined");
  };

  // Hidden during SSR hydration, hidden if user already chose
  if (consent === "loading" || consent === "accepted" || consent === "declined") {
    return null;
  }

  return (
    <>
      {/* Backdrop blur overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[998] pointer-events-none" />

      {/* Banner */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[999] p-4 sm:p-6",
          "animate-in slide-in-from-bottom-4 duration-500"
        )}
      >
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Main content */}
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                <Cookie className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-heading font-bold text-base text-txt mb-1">
                  We use cookies 🍪
                </h2>
                <p className="text-sm text-txt-secondary leading-relaxed">
                  EduPlay uses essential cookies to keep you logged in and make the platform work. We also use analytics cookies to improve your experience.
                </p>

                {/* Expandable details */}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary mt-2 hover:underline focus:outline-none"
                >
                  {expanded ? "Hide details" : "Learn more"}
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {expanded && (
                  <div className="mt-3 space-y-2 text-xs text-txt-secondary bg-background rounded-xl p-4 border border-border/40">
                    <div>
                      <span className="font-semibold text-txt">Essential cookies</span> — Required for login sessions and security. Cannot be disabled.
                    </div>
                    <div>
                      <span className="font-semibold text-txt">Analytics cookies</span> — Help us understand how you use EduPlay so we can improve it. You can decline these.
                    </div>
                    <div>
                      <span className="font-semibold text-txt">No advertising cookies</span> — We never use cookies to track you for ads or sell your data.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-5 sm:justify-end">
              <button
                onClick={handleDecline}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-txt-secondary hover:bg-background hover:text-txt transition-all"
              >
                <X className="w-4 h-4" />
                Decline optional
              </button>
              <button
                onClick={handleAccept}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary-dark hover:shadow-md transition-all"
              >
                <Check className="w-4 h-4" />
                Accept all cookies
              </button>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="px-5 sm:px-6 py-3 bg-background/50 border-t border-border/40 flex items-center justify-between gap-4">
            <p className="text-[11px] text-txt-secondary">
              Your choice is saved in your browser. You can change it anytime in settings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
