import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const games = await prisma.game.findMany({
    where: { educatorId: profile.id },
    include: { progress: { include: { student: { select: { name: true } } } }, vocabularySet: { include: { items: { take: 5 } } } },
  });

  const engagement = games.map((g) => ({ name: g.title, plays: g.progress.length }));

  const gameStats = games
    .filter((g) => g.progress.length > 0)
    .map((g) => ({ title: g.title, avgScore: g.progress.reduce((s, p) => s + p.score, 0) / g.progress.length, words: g.vocabularySet.items.map((i) => i.word) }))
    .sort((a, b) => a.avgScore - b.avgScore);
  const hardestWords = gameStats.slice(0, 3).flatMap((g) => g.words.map((w) => ({ word: w, game: g.title, avgScore: Math.round(g.avgScore) }))).slice(0, 10);

  const now = new Date();
  const days: { day: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    const secs = games.flatMap((g) => g.progress).filter((p) => p.completedAt >= dayStart && p.completedAt <= dayEnd).reduce((s, p) => s + p.timeTaken, 0);
    days.push({ day: d.toLocaleDateString("en-US", { weekday: "short" }), minutes: Math.round(secs / 60) });
  }

  const classes = await prisma.class.findMany({
    where: { educatorId: profile.id },
    include: { members: { select: { studentId: true } } },
  });
  const allProgress = games.flatMap((g) => g.progress);
  const classPerf = classes.map((c) => {
    const ids = new Set(c.members.map((m) => m.studentId));
    const rel = allProgress.filter((p) => ids.has(p.studentId));
    return { name: c.name, avgScore: rel.length ? Math.round(rel.reduce((s, p) => s + p.score, 0) / rel.length) : 0 };
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Analytics</h1>
      <AnalyticsCharts engagement={engagement} timeSpent={days} classPerf={classPerf} hardestWords={hardestWords} />
    </div>
  );
}
