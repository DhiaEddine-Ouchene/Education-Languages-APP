// Chargily Pay integration for Algerian customers (DZD)
// Docs: https://dev.chargily.com/pay-v2/

export const CHARGILY_PLANS = {
  PRO: {
    name: "Pro",
    monthly: {
      dzd: 1600,
      priceId: process.env.CHARGILY_PRICE_PRO_MONTHLY ?? "",
      link: process.env.CHARGILY_LINK_PRO_MONTHLY ?? "",
    },
    yearly: {
      dzd: 13300,
      priceId: process.env.CHARGILY_PRICE_PRO_YEARLY ?? "",
      link: process.env.CHARGILY_LINK_PRO_YEARLY ?? "",
    },
  },
  ULTIMATE: {
    name: "Ultimate",
    monthly: {
      dzd: 2950,
      priceId: process.env.CHARGILY_PRICE_ULTIMATE_MONTHLY ?? "",
      link: process.env.CHARGILY_LINK_ULTIMATE_MONTHLY ?? "",
    },
    yearly: {
      dzd: 24000,
      priceId: process.env.CHARGILY_PRICE_ULTIMATE_YEARLY ?? "",
      link: process.env.CHARGILY_LINK_ULTIMATE_YEARLY ?? "",
    },
  },
} as const;

// Map Chargily Price IDs to Plan + Interval + Duration
type PlanMapping = {
  plan: "PRO" | "ULTIMATE";
  interval: "monthly" | "yearly";
  days: number;
};

export function getPlanFromChargilyPrice(priceId: string): PlanMapping | null {
  const priceMap: Record<string, PlanMapping> = {
    [CHARGILY_PLANS.PRO.monthly.priceId]: { plan: "PRO", interval: "monthly", days: 30 },
    [CHARGILY_PLANS.PRO.yearly.priceId]: { plan: "PRO", interval: "yearly", days: 365 },
    [CHARGILY_PLANS.ULTIMATE.monthly.priceId]: { plan: "ULTIMATE", interval: "monthly", days: 30 },
    [CHARGILY_PLANS.ULTIMATE.yearly.priceId]: { plan: "ULTIMATE", interval: "yearly", days: 365 },
  };

  return priceMap[priceId] ?? null;
}

// Helper to check if Chargily is configured
export function isChargilyConfigured(): boolean {
  return !!(
    process.env.CHARGILY_API_KEY &&
    process.env.CHARGILY_API_SECRET_KEY &&
    CHARGILY_PLANS.PRO.monthly.link &&
    CHARGILY_PLANS.PRO.yearly.link &&
    CHARGILY_PLANS.ULTIMATE.monthly.link &&
    CHARGILY_PLANS.ULTIMATE.yearly.link
  );
}

// Format DZD price with locale
export function formatDZD(amount: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);
}
