"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckoutModal } from "./CheckoutModal";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle,
  Sparkles,
  Zap,
  Crown,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_FEATURES = {
  FREE: {
    name: "Free",
    monthly: "$0",
    yearly: "$0",
    color: "bg-muted/40 border-border",
    badge: "default" as const,
    icon: Sparkles,
    features: [
      "1 class | up to 20 students",
      "Unlimited manual games",
      "15 AI games / month",
      "Core game types",
    ],
  },
  PRO: {
    name: "Pro",
    monthly: "$12/mo",
    yearly: "$99/yr",
    color: "border-primary/30 bg-primary/5",
    badge: "accent" as const,
    icon: Zap,
    features: [
      "Unlimited classes & students",
      "Unlimited AI games",
      "All game types",
      "PDF import (up to 10 pages)",
      "Full class analytics",
    ],
  },
  ULTIMATE: {
    name: "Ultimate",
    monthly: "$22/mo",
    yearly: "$179/yr",
    color: "border-accent/40 bg-accent/5",
    badge: "accent" as const,
    icon: Crown,
    features: [
      "Everything in Pro",
      "Multi-chapter PDF import",
      "Exportable analytics (PDF/CSV)",
      "Co-teacher (up to 3 seats)",
      "Priority support & early access",
    ],
  },
} as const;

type HistoryRow = {
  id: string;
  plan: string;
  status: string;
  createdAt: string;
  currentPeriodEnd: string | null;
};

export function BillingClient({
  currentPlan,
  history,
}: {
  currentPlan: string;
  history: HistoryRow[];
}) {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    key: string;
    name: string;
    price: number;
    interval: "monthly" | "yearly";
  } | null>(null);

  // Determine if a plan is an upgrade from current
  const planRank: Record<string, number> = {
    FREE: 0,
    PRO: 1,
    ULTIMATE: 2,
  };
  const currentRank = planRank[currentPlan] ?? 0;

  const handleSubscribe = (planKey: string) => {
    const planData = PLAN_FEATURES[planKey as keyof typeof PLAN_FEATURES];
    if (!planData || planKey === "FREE") return;

    const price = annual ? (planKey === "PRO" ? 99 : 179) : (planKey === "PRO" ? 12 : 22);

    setSelectedPlan({
      key: planKey,
      name: planData.name,
      price,
      interval: annual ? "yearly" : "monthly",
    });
    setCheckoutOpen(true);
  };

  const handleDowngradeToFree = async () => {
    if (!confirm("Downgrade to Free? You will lose access to premium features at the end of the billing period.")) return;
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) return;
      router.refresh();
    } catch {}
  };

  const handleCancel = async () => {
    if (
      !confirm(
        "Cancel your subscription? It stays active until the end of the billing period."
      )
    )
      return;
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) return;
      router.refresh();
    } catch {}
  };

  const isActivePaidPlan =
    currentPlan === "PRO" || currentPlan === "ULTIMATE";

  // Current plan details for the header
  const currentPlanInfo =
    PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES] ??
    PLAN_FEATURES.FREE;

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      <Card
        className={cn(
          "relative overflow-hidden",
          isActivePaidPlan
            ? "border-primary/30"
            : "border-border"
        )}
      >
        {isActivePaidPlan && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        )}
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-heading font-semibold text-lg">
                  {currentPlanInfo.name} plan
                </h2>
                <Badge
                  variant={
                    isActivePaidPlan ? "accent" : "outline"
                  }
                >
                  {currentPlan === "FREE" ? "Free tier" : "Active"}
                </Badge>
              </div>
              <p className="text-sm text-txt-secondary">
                {currentPlan === "FREE"
                  ? "You are on the Free tier. Upgrade to unlock premium features."
                  : `You are subscribed to the ${currentPlan} plan.`}
              </p>
            </div>
            {isActivePaidPlan && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan selector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Choose your plan</CardTitle>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <span
              className={cn(
                "text-xs transition-colors",
                !annual && "text-foreground font-semibold"
              )}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                "w-10 h-5 rounded-pill relative transition-colors",
                annual ? "bg-accent" : "bg-border"
              )}
              aria-label="Toggle annual billing"
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 bg-white rounded-pill transition-all shadow-sm",
                  annual ? "left-5" : "left-0.5"
                )}
              />
            </button>
            <span
              className={cn(
                "text-xs transition-colors",
                annual && "text-foreground font-semibold"
              )}
            >
              Annual
            </span>
            {annual && (
              <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                Save ~31%
              </Badge>
            )}
          </label>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {(["FREE", "PRO", "ULTIMATE"] as const).map((planKey) => {
              const planData = PLAN_FEATURES[planKey];
              const isCurrentPlan = currentPlan === planKey;
              const isDowngrade = planRank[planKey] < currentRank;
              const Icon = planData.icon;

              return (
                <div
                  key={planKey}
                  className={cn(
                    "rounded-xl border-2 p-5 relative transition-all duration-200",
                    isCurrentPlan
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:shadow-md"
                  )}
                >
                  {planKey === "ULTIMATE" && (
                    <Badge
                      variant="accent"
                      className="absolute -top-2.5 right-4 text-[10px]"
                    >
                      Best value
                    </Badge>
                  )}

                  {/* Plan icon */}
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    {Icon && <Icon className="h-5 w-5 text-primary" />}
                  </div>

                  <h3 className="font-heading font-bold text-lg mb-1">
                    {planData.name}
                  </h3>

                  <div className="mb-3">
                    <span className="font-heading font-bold text-3xl">
                      {planKey === "FREE" ? "$0" : (annual ? planData.yearly : planData.monthly)}
                    </span>
                    <span className="text-txt-secondary text-sm ml-1">
                      {planKey === "FREE" ? "" : `/${annual ? "yr" : "mo"}`}
                    </span>
                    {annual && planKey !== "FREE" && (
                      <p className="text-xs text-accent mt-0.5">
                        ~$
                        {planKey === "PRO"
                          ? Math.round(99 / 12)
                          : Math.round(179 / 12)}
                        /mo billed annually
                      </p>
                    )}
                    {planKey === "FREE" && (
                      <p className="text-xs text-txt-secondary mt-0.5">Free forever</p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-5">
                    {planData.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-xs text-txt-secondary"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={
                      isCurrentPlan
                        ? "outline"
                        : isDowngrade
                        ? "danger"
                        : "primary"
                    }
                    disabled={isCurrentPlan}
                    onClick={() => planKey === "FREE" ? handleDowngradeToFree() : handleSubscribe(planKey)}
                  >
                    {isCurrentPlan
                      ? "Current plan"
                      : isDowngrade
                      ? "Downgrade to Free"
                      : planKey === "FREE"
                      ? "Stay Free"
                      : `Upgrade to ${planData.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing history */}
      <Card>
        <CardHeader>
          <CardTitle>Billing history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-txt-secondary py-6 text-center">
              No billing history yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-txt-secondary border-b border-border">
                    <th className="py-2 font-medium">Plan</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Started</th>
                    <th className="py-2 font-medium">Period end</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr
                      key={h.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-2.5 font-medium">{h.plan}</td>
                      <td>
                        <StatusBadge status={h.status} />
                      </td>
                      <td className="text-txt-secondary text-xs">
                        {formatDate(h.createdAt)}
                      </td>
                      <td className="text-txt-secondary text-xs">
                        {h.currentPeriodEnd
                          ? formatDate(h.currentPeriodEnd)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout modal */}
      {selectedPlan && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setSelectedPlan(null);
          }}
          plan={selectedPlan}
          onSuccess={() => {
            setCheckoutOpen(false);
            setSelectedPlan(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "ACTIVE"
      ? ("accent" as const)
      : status === "PAST_DUE"
      ? ("error" as const)
      : ("outline" as const);
  const Icon =
    status === "ACTIVE"
      ? CheckCircle
      : status === "CANCELLED"
      ? XCircle
      : HelpCircle;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}
