"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Loader2,
  CheckCircle,
  CreditCard,
  Lock,
  ArrowRight,
  AlertCircle,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlanInfo = {
  key: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
};

type Step = "plan" | "creating" | "form" | "processing" | "success" | "error" | "popup";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: PlanInfo;
  onSuccess: () => void;
};

const ANNUAL_SAVINGS: Record<string, number> = {
  PRO: Math.round((1 - 99 / (12 * 12)) * 100),
  ULTIMATE: Math.round((1 - 179 / (22 * 12)) * 100),
};

export function CheckoutModal({ open, onClose, plan, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("plan");
  const [errorMsg, setErrorMsg] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    };
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("plan");
      setErrorMsg("");
      setCheckoutUrl(null);
      setIsMock(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
      setCardName("");
      setFormErrors({});
    }
  }, [open]);

  // ── Create checkout session ──
  const handleContinue = useCallback(async () => {
    setStep("creating");
    setErrorMsg("");

    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.key,
          interval: plan.interval,
          embed: true,
          dryRun: true, // Don't create subscription yet
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create checkout");

      if (data.mock) {
        // Dev mode — show embedded card form
        setIsMock(true);
        setStep("form");
      } else {
        // Real LS checkout — create it for real and open popup
        const realRes = await fetch("/api/billing/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: plan.key,
            interval: plan.interval,
            embed: true,
            dryRun: false,
          }),
        });
        const realData = await realRes.json();
        if (!realRes.ok || !realData.url) throw new Error(realData.error ?? "Could not create checkout");

        setCheckoutUrl(realData.url);
        setStep("popup");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong");
      setStep("error");
    }
  }, [plan.key, plan.interval]);

  // ── Open LS popup ──
  const openPopup = useCallback(() => {
    if (!checkoutUrl) return;

    const width = 520;
    const height = 700;
    const left = Math.max(0, Math.round(window.screenX + (window.innerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.innerHeight - height) / 2));

    const popup = window.open(
      checkoutUrl,
      "lemonsqueezy-checkout",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed) {
      setErrorMsg("Popup was blocked. Please allow popups for this site and try again.");
      setStep("error");
      return;
    }

    popupRef.current = popup;
    pollTimerRef.current = setInterval(() => {
      if (popup.closed) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        popupRef.current = null;
        setStep("success");
        setTimeout(() => onSuccess(), 1500);
      }
    }, 500);
  }, [checkoutUrl, onSuccess]);

  // ── Card form validation ──
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!cardName.trim()) errors.name = "Cardholder name is required";
    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard.length < 13 || cleanCard.length > 19) errors.number = "Invalid card number";
    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) errors.expiry = "Use MM/YY format";
    if (!cardCvc.match(/^\d{3,4}$/)) errors.cvc = "Invalid CVC";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [cardName, cardNumber, cardExpiry, cardCvc]);

  // ── Submit mock payment ──
  const handlePay = useCallback(() => {
    if (!validateForm()) return;
    setStep("processing");

    // Simulate payment processing delay
    setTimeout(async () => {
      try {
        // Complete the mock subscription
        const res = await fetch("/api/billing/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: plan.key,
            interval: plan.interval,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Payment failed");

        setStep("success");
        setTimeout(() => onSuccess(), 2000);
      } catch (err: any) {
        setErrorMsg(err.message || "Payment failed");
        setStep("error");
      }
    }, 2500);
  }, [plan, validateForm, onSuccess]);

  // ── Card number formatting ──
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // ── Expiry formatting ──
  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  if (!open) return null;

  const savings = plan.interval === "yearly" ? ANNUAL_SAVINGS[plan.key] ?? 31 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step === "plan" || step === "error" || step === "form" ? onClose : undefined}
      />

      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close */}
        {(step === "plan" || step === "error" || step === "form") && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-txt-secondary" />
          </button>
        )}

        {/* Color bar */}
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />

        {/* ── STEP: Plan review ── */}
        {step === "plan" && (
          <div className="p-6 pt-5">
            <div className="text-center mb-6">
              <h2 className="font-heading font-bold text-xl mb-1">Upgrade to {plan.name}</h2>
              <p className="text-txt-secondary text-sm">You&apos;re about to unlock all {plan.name} features</p>
            </div>

            <div className="bg-muted/40 rounded-xl p-5 mb-6 border border-border text-center">
              <div className="flex items-baseline justify-center gap-1.5 mb-1">
                <span className="font-heading font-bold text-4xl">${plan.price}</span>
                <span className="text-txt-secondary text-sm">/{plan.interval === "yearly" ? "year" : "month"}</span>
              </div>
              {plan.interval === "yearly" && savings > 0 && (
                <p className="text-sm text-accent font-medium">Save {savings}% compared to monthly</p>
              )}
            </div>

            <div className="space-y-2.5 mb-6">
              {(plan.key === "PRO" ? [
                "Unlimited classes & students",
                "Unlimited AI-generated games",
                "All game types",
                "PDF → game import",
                "Full class analytics",
              ] : [
                "Everything in Pro",
                "Multi-chapter PDF import",
                "Exportable analytics",
                "Co-teacher (up to 3 seats)",
                "Priority support & early access",
              ]).map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-txt-secondary">
                  <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <Button className="w-full h-12 text-base gap-2" onClick={handleContinue}>
              <Lock className="h-4 w-4" />
              Continue to payment
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-center text-xs text-txt-secondary mt-3">
              Secure payment · Powered by Lemon Squeezy
            </p>
          </div>
        )}

        {/* ── STEP: Creating checkout ── */}
        {step === "creating" && (
          <div className="p-6 text-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="font-heading font-semibold text-lg mb-1">Preparing your checkout...</p>
            <p className="text-txt-secondary text-sm">Setting up a secure payment session</p>
          </div>
        )}

        {/* ── STEP: Card form (dev mode) ── */}
        {step === "form" && (
          <div className="p-6 pt-5">
            <div className="text-center mb-5">
              <h2 className="font-heading font-bold text-lg mb-1">Enter payment details</h2>
              <p className="text-txt-secondary text-xs">
                {plan.name} · ${plan.price}/{plan.interval === "yearly" ? "yr" : "mo"}
                {isMock && (
                  <span className="block mt-1 text-[10px] text-primary/60">
                    🔧 Dev mode — use any test card
                  </span>
                )}
              </p>
            </div>

            {/* Card preview */}
            <div className="bg-gradient-to-br from-primary/90 to-primary rounded-xl p-4 mb-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <Globe className="h-5 w-5 opacity-80" />
                <CreditCard className="h-5 w-5 opacity-80" />
              </div>
              <p className="font-mono text-lg tracking-widest mb-3">
                {cardNumber || "••••  ••••  ••••  ••••"}
              </p>
              <div className="flex justify-between text-xs opacity-80">
                <div>
                  <p className="text-[10px] opacity-60">Cardholder</p>
                  <p className="font-mono">{cardName || "Your Name"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-60">Expires</p>
                  <p className="font-mono">{cardExpiry || "MM/YY"}</p>
                </div>
              </div>
            </div>

            {/* Card form fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-1">Cardholder name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className={cn(
                    "w-full h-10 rounded-lg border bg-card px-3 text-sm outline-none transition-colors",
                    formErrors.name ? "border-destructive" : "border-border focus:border-primary"
                  )}
                />
                {formErrors.name && <p className="text-xs text-destructive mt-0.5">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-1">Card number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className={cn(
                    "w-full h-10 rounded-lg border bg-card px-3 text-sm outline-none transition-colors font-mono",
                    formErrors.number ? "border-destructive" : "border-border focus:border-primary"
                  )}
                />
                {formErrors.number && <p className="text-xs text-destructive mt-0.5">{formErrors.number}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1">Expiry date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    className={cn(
                      "w-full h-10 rounded-lg border bg-card px-3 text-sm outline-none transition-colors font-mono",
                      formErrors.expiry ? "border-destructive" : "border-border focus:border-primary"
                    )}
                  />
                  {formErrors.expiry && <p className="text-xs text-destructive mt-0.5">{formErrors.expiry}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    className={cn(
                      "w-full h-10 rounded-lg border bg-card px-3 text-sm outline-none transition-colors font-mono",
                      formErrors.cvc ? "border-destructive" : "border-border focus:border-primary"
                    )}
                  />
                  {formErrors.cvc && <p className="text-xs text-destructive mt-0.5">{formErrors.cvc}</p>}
                </div>
              </div>

              {/* Security badge */}
              <div className="flex items-center gap-2 text-xs text-txt-secondary pt-1">
                <Lock className="h-3 w-3" />
                <span>Your card details are secure and encrypted</span>
              </div>
            </div>

            <Button className="w-full h-12 mt-5 text-base gap-2" onClick={handlePay}>
              <Lock className="h-4 w-4" />
              Pay ${plan.price}
            </Button>
          </div>
        )}

        {/* ── STEP: Popup checkout ── */}
        {step === "popup" && (
          <div className="p-6 text-center py-20">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <p className="font-heading font-semibold text-lg mb-1">Secure checkout ready</p>
            <p className="text-txt-secondary text-sm mb-6">
              Click below to open the secure payment window
            </p>
            <Button className="w-full h-12 text-base gap-2" onClick={openPopup}>
              <CreditCard className="h-4 w-4" />
              Open payment window
            </Button>
            <p className="text-xs text-txt-secondary mt-3">
              A popup will open where you can enter your card details
            </p>
          </div>
        )}

        {/* ── STEP: Processing ── */}
        {step === "processing" && (
          <div className="p-6 text-center py-20">
            <div className="relative mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            </div>
            <p className="font-heading font-semibold text-lg mb-1">Processing payment...</p>
            <p className="text-txt-secondary text-sm">Please wait while we process your payment</p>
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step === "success" && (
          <div className="p-6 text-center py-16">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 animate-in zoom-in-150 duration-300">
              <CheckCircle className="h-9 w-9 text-accent" />
            </div>
            <p className="font-heading font-bold text-xl mb-1 text-accent">Payment successful!</p>
            <p className="text-txt-secondary text-sm">
              Welcome to {plan.name}! Your account has been upgraded.
            </p>
          </div>
        )}

        {/* ── STEP: Error ── */}
        {step === "error" && (
          <div className="p-6 text-center py-16">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="font-heading font-semibold text-lg mb-1">Payment failed</p>
            <p className="text-txt-secondary text-sm mb-6">{errorMsg}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={() => setStep("plan")}>Try again</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
