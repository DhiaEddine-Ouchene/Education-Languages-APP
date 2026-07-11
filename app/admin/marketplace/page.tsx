import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModerationActions } from "@/components/admin/ModerationActions";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMarketplacePage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const [pendingCourses, pendingGames, approvedCourses, approvedGames, rejectedCourses, rejectedGames] = await Promise.all([
    prisma.course.findMany({ where: { isMarketplace: true, approved: false, rejectReason: null }, include: { educator: { include: { user: true } } } }),
    prisma.game.findMany({ where: { isMarketplace: true, approved: false, rejectReason: null }, include: { educator: { include: { user: true } } } }),
    prisma.course.findMany({ where: { isMarketplace: true, approved: true }, select: { id: true, title: true, price: true } }),
    prisma.game.findMany({ where: { isMarketplace: true, approved: true }, select: { id: true, title: true, price: true } }),
    prisma.course.findMany({ where: { isMarketplace: true, rejectReason: { not: null } }, select: { id: true, title: true, rejectReason: true } }),
    prisma.game.findMany({ where: { isMarketplace: true, rejectReason: { not: null } }, select: { id: true, title: true, rejectReason: true } }),
  ]);

  const pending = [
    ...pendingCourses.map((c) => ({ id: c.id, kind: "course" as const, title: c.title, price: c.price, creator: c.educator.user.name })),
    ...pendingGames.map((g) => ({ id: g.id, kind: "game" as const, title: g.title, price: g.price, creator: g.educator.user.name })),
  ];
  const approved = [...approvedCourses.map((c) => ({ ...c, kind: "Course" })), ...approvedGames.map((g) => ({ ...g, kind: "Game" }))];
  const rejected = [...rejectedCourses.map((c) => ({ ...c, kind: "Course" })), ...rejectedGames.map((g) => ({ ...g, kind: "Game" }))];

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Marketplace moderation</h1>

      <Card>
        <CardHeader><CardTitle>Pending approval ({pending.length})</CardTitle></CardHeader>
        <CardContent>
          {pending.length === 0 ? <p className="text-sm text-txt-secondary py-4 text-center">Queue is empty. 🎉</p> : (
            <ul className="divide-y divide-border">
              {pending.map((p) => (
                <li key={`${p.kind}-${p.id}`} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{p.title} <Badge variant="outline">{p.kind}</Badge></p>
                    <p className="text-xs text-txt-secondary">by {p.creator} · {p.price > 0 ? formatCurrency(p.price) : "Free"}</p>
                  </div>
                  <ModerationActions id={p.id} kind={p.kind} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Approved ({approved.length})</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {approved.map((a) => <li key={`${a.kind}-${a.id}`} className="py-2 flex justify-between"><span>{a.title}</span><Badge variant="accent">{a.kind}</Badge></li>)}
              {approved.length === 0 && <p className="text-sm text-txt-secondary py-4 text-center">Nothing approved yet.</p>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rejected ({rejected.length})</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {rejected.map((r) => <li key={`${r.kind}-${r.id}`} className="py-2"><p>{r.title} <Badge variant="error">{r.kind}</Badge></p><p className="text-xs text-txt-secondary">Reason: {r.rejectReason}</p></li>)}
              {rejected.length === 0 && <p className="text-sm text-txt-secondary py-4 text-center">Nothing rejected.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
