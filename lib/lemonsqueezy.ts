import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

// Initialize Lemon Squeezy with the API key from environment variables
lemonSqueezySetup({
  apiKey: process.env.LEMON_SQUEEZY_API_KEY ?? "dummy_key",
  onError: (error) => console.error("Lemon Squeezy Error: ", error),
});

export const PLANS = {
  FREE: {
    name: "Free",
    monthly: 0,
    yearly: 0,
    variantIdMonthly: "",
    variantIdYearly: "",
    features: [
      "1 class | up to 20 students",
      "5 published games (total)",
      "3 AI-generated games / month",
      "Core game types (Flashcards, Quiz, Memory)",
    ],
  },
  PRO: {
    name: "Pro",
    monthly: 12,
    yearly: 99,
    variantIdMonthly: process.env.LS_VARIANT_PRO_MONTHLY ?? "",
    variantIdYearly: process.env.LS_VARIANT_PRO_YEARLY ?? "",
    features: [
      "Unlimited classes & students",
      "Unlimited games & AI generations",
      "All game types",
      "PDF → game import (up to 10 pages)",
      "Full class analytics",
    ],
  },
  ULTIMATE: {
    name: "Ultimate",
    monthly: 22,
    yearly: 179,
    variantIdMonthly: process.env.LS_VARIANT_ULTIMATE_MONTHLY ?? "",
    variantIdYearly: process.env.LS_VARIANT_ULTIMATE_YEARLY ?? "",
    features: [
      "Everything in Pro",
      "Multi-chapter PDF import",
      "Exportable analytics (PDF/CSV)",
      "Priority support",
      "Early access to new features",
    ],
  },
} as const;

export const PLAN_MRR: Record<string, number> = {
  FREE: 0,
  PRO: 12,
  ULTIMATE: 22,
};
export const PLATFORM_REVENUE_SHARE = 0.25; // platform 25%, creators 75%

export function planFromVariantId(
  variantId: string | number
): "PRO" | "ULTIMATE" | null {
  const vId = variantId.toString();
  for (const key of ["PRO", "ULTIMATE"] as const) {
    if (PLANS[key].variantIdMonthly === vId || PLANS[key].variantIdYearly === vId)
      return key;
  }
  return null;
}
