"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

const plans = [
  { key: "STARTER", name: "Starter", price: "$19/mo" },
  { key: "PRO", name: "Pro", price: "$49/mo" },
  { key: "SCHOOL", name: "School", price: "$199/mo" },
];

type HistoryRow = { id: string; plan: string; status: string; createdAt: string; currentPeriodEnd: string | null };

export function BillingClient({ currentPlan, history }: { currentPlan: string; history: HistoryRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [annual, setAnnual] = useState(false);

  const subscribe = async (plan: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, interval: annual ? "yearly" : "monthly" }) });
      const data = await res.json();
      if (!res.ok || !data.url) return toast("error", data.error ?? "Could not start checkout");
      window.location.href = data.url;
    } finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!confirm("Cancel your subscription? It stays active until the end of the period.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) return toast("error", "Failed to cancel");
      toast("success", "Subscription will cancel at period end");
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Current plan</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <Badge className="text-sm">{currentPlan}</Badge>
          {currentPlan !== "FREE" && <Button variant="danger" size="sm" onClick={cancel} disabled={busy}>Cancel subscription</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Change plan</CardTitle>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={annual} onChange={(e) => setAnnual(e.target.checked)} /> Annual (20% off)</label>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          {plans.map((p) => (
            <div key={p.key} className="border border-border rounded-card p-4 text-center">
              <p className="font-heading font-semibold">{p.name}</p>
              <p className="text-sm text-txt-secondary mb-3">{p.price}</p>
              <Button size="sm" className="w-full" variant={currentPlan === p.key ? "outline" : "primary"} disabled={busy || currentPlan === p.key} onClick={() => subscribe(p.key)}>
                {currentPlan === p.key ? "Current" : "Choose"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Billing history</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-txt-secondary py-4 text-center">No billing history yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-txt-secondary border-b border-border"><th className="py-2">Plan</th><th>Status</th><th>Started</th><th>Period end</th></tr></thead>
              <tbody>{history.map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0">
                  <td className="py-2">{h.plan}</td>
                  <td><Badge variant={h.status === "ACTIVE" ? "accent" : h.status === "PAST_DUE" ? "error" : "outline"}>{h.status}</Badge></td>
                  <td>{formatDate(h.createdAt)}</td>
                  <td>{h.currentPeriodEnd ? formatDate(h.currentPeriodEnd) : "-"}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
