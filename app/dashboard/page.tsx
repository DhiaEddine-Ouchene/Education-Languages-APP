import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Users, School, Gamepad2, DollarSign, BookOpen, BarChart3, Palette, Plus, ArrowRight, Sparkles, TrendingUp } from "lucide-react";

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

  const totalGames = await prisma.game.count({ where: { educatorId: profile.id } });

  const quickActions = [
    { href: "/dashboard/games/new", label: "Create Game", description: "AI-powered game builder", icon: Gamepad2, color: "text-primary", bg: "bg-primary/10" },
    { href: "/dashboard/classes/new", label: "New Class", description: "Invite students with code", icon: School, color: "text-accent", bg: "bg-accent/10" },
    { href: "/dashboard/analytics", label: "Analytics", description: "Track student performance", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-100" },
    { href: "/dashboard/branding", label: "Branding", description: "Customize your look", icon: Palette, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/[0.08] via-primary/[0.02] to-accent/[0.05] border border-primary/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-txt">
              Welcome back, {session.user.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-txt-secondary text-sm mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link href="/dashboard/games/new">
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Sparkles className="w-4 h-4" />
              Create Game
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} value={students.length} label="Total Students" />
        <StatCard icon={School} value={classes.length} label="Active Classes" />
        <StatCard icon={Gamepad2} value={`${gamesPublished}/${totalGames}`} label="Games Published" />
        <StatCard icon={DollarSign} value={formatCurrency(profile.monthlyRevenue)} label="Monthly Revenue" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="h-full group hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="pt-5">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110", a.bg)}>
                  <a.icon className={cn("w-5 h-5", a.color)} />
                </div>
                <p className="font-heading font-semibold text-sm text-txt group-hover:text-primary transition-colors">{a.label}</p>
                <p className="text-xs text-txt-secondary mt-0.5">{a.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Classes & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <School className="w-4 h-4 text-txt-secondary" />
              My Classes
            </CardTitle>
            <Link href="/dashboard/classes/new">
              <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" /> New</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <EmptyState
                title="No classes yet"
                description="Create your first class to invite students with a code."
                ctaLabel="Create class"
                ctaHref="/dashboard/classes/new"
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {classes.slice(0, 5).map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between group">
                    <div>
                      <p className="font-medium text-sm text-txt">{c.name}</p>
                      <p className="text-xs text-txt-secondary mt-0.5">
                        {c.language} · {c.level} · {c._count.members} {c._count.members === 1 ? "student" : "students"}
                      </p>
                    </div>
                    <Link href={`/dashboard/classes/${c.id}`}>
                      <Button size="sm" variant="ghost" className="group-hover:bg-primary/5">
                        Manage <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </li>
                ))}
                {classes.length > 5 && (
                  <li className="pt-3 text-center">
                    <Link href="/dashboard/classes">
                      <Button variant="ghost" size="sm" className="text-xs text-txt-secondary">
                        View all {classes.length} classes <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-txt-secondary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProgress.length === 0 ? (
              <div className="py-8 text-center">
                <BarChart3 className="w-10 h-10 mx-auto text-txt-secondary/40 mb-3" />
                <p className="text-sm text-txt-secondary font-medium">No student activity yet</p>
                <p className="text-xs text-txt-secondary/60 mt-1">Activity appears when students play your games.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentProgress.map((p) => (
                  <li key={p.id} className="py-2.5 text-sm flex justify-between gap-3">
                    <span className="text-txt">
                      <span className="font-medium">{p.student.name}</span>
                      <span className="text-txt-secondary"> scored </span>
                      <span className={cn(
                        "font-semibold",
                        p.score >= 80 ? "text-green-600" : p.score >= 50 ? "text-amber-600" : "text-red-500"
                      )}>
                        {Math.round(p.score)}%
                      </span>
                      <span className="text-txt-secondary"> on </span>
                      <span className="font-medium">{p.game.title}</span>
                    </span>
                    <span className="text-xs text-txt-secondary whitespace-nowrap shrink-0 pt-0.5">{formatDate(p.completedAt)}</span>
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
