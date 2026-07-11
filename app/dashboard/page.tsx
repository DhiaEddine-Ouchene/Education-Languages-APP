import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, School, Gamepad2, DollarSign, BookOpen, BarChart3, Palette, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const [classes, gamesPublished, students, recentProgress] = await Promise.all([
    prisma.class.findMany({ where: { educatorId: profile.id }, include: { _count: { select: { members: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.game.count({ where: { educatorId: profile.id, isPublished: true } }),
    prisma.classMember.findMany({ where: { class: { educatorId: profile.id } }, distinct: ["studentId"], select: { studentId: true } }),
    prisma.studentProgress.findMany({
      where: { game: { educatorId: profile.id } },
      include: { student: { select: { name: true } }, game: { select: { title: true } } },
      orderBy: { completedAt: "desc" }, take: 8,
    }),
  ]);

  const quickActions = [
    { href: "/dashboard/courses/new", label: "Create Course", icon: BookOpen },
    { href: "/dashboard/games/new", label: "Build Game", icon: Gamepad2 },
    { href: "/dashboard/analytics", label: "View Reports", icon: BarChart3 },
    { href: "/dashboard/branding", label: "Customize Brand", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Welcome back, {session.user.name?.split(" ")[0]} 👋</h1>
        <p className="text-txt-secondary text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} value={students.length} label="Total Students" />
        <StatCard icon={School} value={classes.length} label="Active Classes" />
        <StatCard icon={Gamepad2} value={gamesPublished} label="Games Published" />
        <StatCard icon={DollarSign} value={formatCurrency(profile.monthlyRevenue)} label="Monthly Revenue" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="h-full">
              <CardContent className="pt-5 flex flex-col items-center text-center gap-2">
                <a.icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{a.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My classes</CardTitle>
            <Link href="/dashboard/classes/new"><Button size="sm" variant="outline"><Plus className="h-4 w-4" /> New</Button></Link>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <EmptyState title="No classes yet" description="Create your first class and invite students with a code." ctaLabel="Create class" ctaHref="/dashboard/classes/new" />
            ) : (
              <ul className="divide-y divide-border">
                {classes.slice(0, 5).map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-txt-secondary">{c.language} · {c.level} · {c._count.members} students</p>
                    </div>
                    <Link href={`/dashboard/classes/${c.id}`}><Button size="sm" variant="ghost">Manage</Button></Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent>
            {recentProgress.length === 0 ? (
              <p className="text-sm text-txt-secondary py-6 text-center">No student activity yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentProgress.map((p) => (
                  <li key={p.id} className="py-2.5 text-sm flex justify-between gap-2">
                    <span><b>{p.student.name}</b> scored {Math.round(p.score)}% on <b>{p.game.title}</b></span>
                    <span className="text-xs text-txt-secondary whitespace-nowrap">{formatDate(p.completedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
