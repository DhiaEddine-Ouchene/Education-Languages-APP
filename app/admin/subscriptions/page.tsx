import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_MRR } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const tabs = ["ACTIVE", "TRIALING", "CANCELLED", "PAST_DUE"] as const;

export default async function AdminSubscriptionsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");
  const tab = (tabs as readonly string[]).includes(searchParams.tab ?? "") ? searchParams.tab! : "ACTIVE";

  const [subs, profiles] = await Promise.all([
    prisma.subscription.findMany({ where: { status: tab as never }, include: { educator: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { createdAt: "desc" } }),
    prisma.educatorProfile.groupBy({ by: ["subscriptionPlan"], _count: true }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Subscriptions</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profiles.map((p) => (
          <Card key={p.subscriptionPlan}><CardContent className="pt-4 pb-4 text-center">
            <p className="font-heading font-bold text-xl">{formatCurrency(p._count * (PLAN_MRR[p.subscriptionPlan] ?? 0))}</p>
            <p className="text-xs text-txt-secondary">{p.subscriptionPlan} MRR ({p._count})</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link key={t} href={`/admin/subscriptions?tab=${t}`} className={cn("px-4 py-2 text-sm border-b-2 -mb-px", tab === t ? "border-primary text-primary font-medium" : "border-transparent text-txt-secondary")}>
            {t === "PAST_DUE" ? "Failed payments" : t.charAt(0) + t.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>
      <Card><CardContent className="pt-4">
        {subs.length === 0 ? <p className="text-sm text-txt-secondary py-6 text-center">No subscriptions in this state.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-txt-secondary border-b border-border"><th className="py-2">Educator</th><th>Plan</th><th>Status</th><th>Started</th><th>Period end</th></tr></thead>
            <tbody>{subs.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="py-2.5"><p className="font-medium">{s.educator.user.name}</p><p className="text-xs text-txt-secondary">{s.educator.user.email}</p></td>
                <td>{s.plan}</td>
                <td><Badge variant={s.status === "ACTIVE" ? "accent" : s.status === "PAST_DUE" ? "error" : "outline"}>{s.status}</Badge></td>
                <td className="text-xs text-txt-secondary">{formatDate(s.createdAt)}</td>
                <td className="text-xs text-txt-secondary">{s.currentPeriodEnd ? formatDate(s.currentPeriodEnd) : "-"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </CardContent></Card>
    </div>
  );
}
