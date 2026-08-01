import { redirect } from "next/navigation";
import { CalendarDays, Gamepad2, Mail, Shield, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/student/ProfileForm";

export const dynamic = "force-dynamic";

const formatDate = (date: Date) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);

export default async function StudentProfilePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const [user, xp, gamesPlayed, badgeCount, lastProgress] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.studentXP.findUnique({ where: { studentId: session.user.id } }),
    prisma.studentProgress.count({ where: { studentId: session.user.id } }),
    prisma.studentBadge.count({ where: { studentId: session.user.id } }),
    prisma.studentProgress.findFirst({ where: { studentId: session.user.id }, orderBy: { completedAt: "desc" } }),
  ]);
  if (!user) redirect("/auth/login");

  const initials = user.name?.trim()?.[0]?.toUpperCase() ?? "U";
  const profileCompleteness = Math.round(((user.name ? 1 : 0) + (user.email ? 1 : 0) + (user.image ? 1 : 0)) / 3 * 100);

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="h-28 bg-gradient-to-r from-primary via-primary-dark to-accent sm:h-36" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:-mt-14">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={`${user.name} profile picture`}
                  className="h-24 w-24 rounded-pill border-4 border-card object-cover shadow-hover sm:h-28 sm:w-28"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-pill border-4 border-card bg-primary text-3xl font-bold text-white shadow-hover sm:h-28 sm:w-28">
                  {initials}
                </div>
              )}
              <div className="pb-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-2xl font-bold sm:text-3xl">{user.name}</h1>
                  <Badge variant="accent">{user.role.toLowerCase()}</Badge>
                </div>
                <p className="flex items-center gap-2 text-sm text-txt-secondary">
                  <Mail className="h-4 w-4" /> {user.email}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-txt-secondary">
                  <CalendarDays className="h-4 w-4" /> Joined {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <div className="rounded-card border border-border bg-background px-4 py-3 text-sm sm:min-w-[180px]">
              <p className="font-semibold text-txt-primary">Profile {profileCompleteness}% complete</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-border">
                <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${profileCompleteness}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { v: xp?.level ?? 1, l: "Level", icon: Trophy, color: "text-primary-dark", bg: "bg-primary-light" },
          { v: xp?.totalXP ?? 0, l: "Total XP", icon: Sparkles, color: "text-accent", bg: "bg-accent-light" },
          { v: gamesPlayed, l: "Games played", icon: Gamepad2, color: "text-warning", bg: "bg-orange-50" },
          { v: badgeCount, l: "Badges", icon: Shield, color: "text-primary-dark", bg: "bg-primary-light" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.l}>
              <CardContent className="pt-4 pb-4">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-card ${s.bg}`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                <p className="font-heading text-2xl font-bold">{s.v}</p>
                <p className="text-xs font-medium text-txt-secondary">{s.l}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit profile + account info */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <ProfileForm name={user.name} avatarUrl={user.image} />
        <Card>
          <CardHeader><CardTitle>Account information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3"><span className="text-txt-secondary">Email</span><span className="font-medium text-right break-all">{user.email}</span></div>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3"><span className="text-txt-secondary">Role</span><span className="font-medium">{user.role}</span></div>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3"><span className="text-txt-secondary">Joined</span><span className="inline-flex items-center gap-1 font-medium"><CalendarDays className="h-4 w-4" /> {formatDate(user.createdAt)}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-txt-secondary">Last game</span><span className="font-medium">{lastProgress ? formatDate(lastProgress.completedAt) : "Not played yet"}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
