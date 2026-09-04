import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_MRR } from "@/lib/lemonsqueezy";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, DollarSign, Receipt, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  let totalUsers = 0;
  let profiles: any[] = [];
  let activeSubs = 0;
  let cancelledRecent = 0;
  let totalSubs = 0;
  let recentSignups: any[] = [];

  try {
    const [
      totalUsersRes,
      profilesRes,
      activeSubsRes,
      cancelledRecentRes,
      totalSubsRes,
      recentSignupsRes,
    ] = await Promise.allSettled([
      prisma.user.count(),
      prisma.educatorProfile.findMany({ select: { subscriptionPlan: true } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "CANCELLED", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.subscription.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    if (totalUsersRes.status === "fulfilled") totalUsers = totalUsersRes.value;
    else console.error("[admin:totalUsers] Query failed:", totalUsersRes.reason);

    if (profilesRes.status === "fulfilled") profiles = profilesRes.value;
    else console.error("[admin:profiles] Query failed:", profilesRes.reason);

    if (activeSubsRes.status === "fulfilled") activeSubs = activeSubsRes.value;
    else console.error("[admin:activeSubs] Query failed:", activeSubsRes.reason);

    if (cancelledRecentRes.status === "fulfilled") cancelledRecent = cancelledRecentRes.value;
    else console.error("[admin:cancelledRecent] Query failed:", cancelledRecentRes.reason);

    if (totalSubsRes.status === "fulfilled") totalSubs = totalSubsRes.value;
    else console.error("[admin:totalSubs] Query failed:", totalSubsRes.reason);

    if (recentSignupsRes.status === "fulfilled") recentSignups = recentSignupsRes.value;
    else console.error("[admin:recentSignups] Query failed:", recentSignupsRes.reason);
  } catch (err) {
    console.error("[admin:overview:page] Overview query exception:", err);
  }

  const mrr = profiles.reduce((s, p) => s + (PLAN_MRR[p.subscriptionPlan] ?? 0), 0);
  const churn = totalSubs > 0 ? Math.round((cancelledRecent / totalSubs) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Platform overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} value={totalUsers} label="Total users" />
        <StatCard icon={DollarSign} value={formatCurrency(mrr)} label="MRR" />
        <StatCard icon={Receipt} value={activeSubs} label="Active subscriptions" />
        <StatCard icon={TrendingDown} value={`${churn}%`} label="Churn (30d)" />
      </div>
      <Card>
        <CardHeader><CardTitle>Recent signups</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-txt-secondary border-b border-border"><th className="py-2">User</th><th>Role</th><th>Signed up</th></tr></thead>
            <tbody>{recentSignups.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="py-2.5"><p className="font-medium">{u.name}</p><p className="text-xs text-txt-secondary">{u.email}</p></td>
                <td><Badge variant={u.role === "EDUCATOR" ? "default" : "accent"}>{u.role}</Badge></td>
                <td className="text-xs text-txt-secondary">{formatDate(u.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
