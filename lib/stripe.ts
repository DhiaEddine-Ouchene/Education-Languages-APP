import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});

export const PLANS = {
  STARTER: {
    name: "Starter",
    monthly: 19,
    yearly: 182,
    priceMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
    priceYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? "",
    features: ["50 students", "Basic games", "Your branding"],
  },
  PRO: {
    name: "Pro",
    monthly: 49,
    yearly: 470,
    priceMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    priceYearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? "",
    features: ["Unlimited students", "White-label", "Custom domain", "All games", "Analytics"],
  },
  SCHOOL: {
    name: "School",
    monthly: 199,
    yearly: 1910,
    priceMonthly: process.env.STRIPE_PRICE_SCHOOL_MONTHLY ?? "",
    priceYearly: process.env.STRIPE_PRICE_SCHOOL_YEARLY ?? "",
    features: ["Multi-teacher", "LMS ready", "Priority support"],
  },
} as const;

export const PLAN_MRR: Record<string, number> = { FREE: 0, STARTER: 19, PRO: 49, SCHOOL: 199 };
export const PLATFORM_REVENUE_SHARE = 0.25; // platform 25%, creators 75%

export function planFromPriceId(priceId: string): "STARTER" | "PRO" | "SCHOOL" | null {
  for (const key of ["STARTER", "PRO", "SCHOOL"] as const) {
    if (PLANS[key].priceMonthly === priceId || PLANS[key].priceYearly === priceId) return key;
  }
  return null;
}
