import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Clock, Link2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EducatorMarketplacePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const [courses, games, sales] = await Promise.all([
    prisma.course.findMany({ where: { educatorId: profile.id, isMarketplace: true }, include: { _count: { select: { purchases: true } }, purchases: true } }),
    prisma.game.findMany({ where: { educatorId: profile.id, isMarketplace: true }, include: { _count: { select: { purchases: true } }, purchases: true } }),
    prisma.marketplacePurchase.findMany({ where: { OR: [{ course: { educatorId: profile.id } }, { game: { educatorId: profile.id } }] } }),
  ]);

  const totalRevenue = sales.reduce((s, p) => s + p.amount, 0);
  const creatorShare = totalRevenue * 0.75;

  const items = [
    ...courses.map((c) => ({ id: c.id, kind: "Course", title: c.title, approved: c.approved, sales: c._count.purchases, revenue: c.purchases.reduce((s, p) => s + p.amount, 0) })),
    ...games.map((g) => ({ id: g.id, kind: "Game", title: g.title, approved: g.approved, sales: g._count.purchases, revenue: g.purchases.reduce((s, p) => s + p.amount, 0) })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Marketplace</h1>
        <Link href="/marketplace"><Button variant="outline" size="sm">Browse public marketplace</Button></Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} value={formatCurrency(totalRevenue)} label="Total sales" />
        <StatCard icon={Clock} value={formatCurrency(creatorShare)} label="Your share (75%), paid monthly" />
        <Card><CardContent className="pt-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-btn bg-primary-light flex items-center justify-center shrink-0"><Link2 className="h-5 w-5 text-primary" /></div>
          <div>
            <p className="font-heading font-bold text-sm leading-tight">{profile.stripeConnectId ? "Stripe Connect linked" : "Stripe Connect not linked"}</p>
            <p className="text-xs text-txt-secondary">{profile.stripeConnectId ? "Payouts are automatic." : "Link Stripe to receive payouts."}</p>
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>My published content</CardTitle></CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-txt-secondary py-6 text-center">No marketplace content yet. Enable “List on marketplace” on a course or game.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-txt-secondary border-b border-border"><th className="py-2">Item</th><th>Status</th><th>Sales</th><th>Revenue</th></tr></thead>
              <tbody>{items.map((i) => (
                <tr key={`${i.kind}-${i.id}`} className="border-b border-border last:border-0">
                  <td className="py-2.5"><span className="font-medium">{i.title}</span> <Badge variant="outline">{i.kind}</Badge></td>
                  <td><Badge variant={i.approved ? "accent" : "warning"}>{i.approved ? "Approved" : "Pending review"}</Badge></td>
                  <td>{i.sales}</td>
                  <td>{formatCurrency(i.revenue)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
