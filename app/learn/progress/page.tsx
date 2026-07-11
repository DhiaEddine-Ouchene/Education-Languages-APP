import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelThreshold, BADGE_DEFS } from "@/lib/xp";
import { ProgressCharts } from "@/components/student/ProgressCharts";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const [xp, progress, badges] = await Promise.all([
    prisma.studentXP.findUnique({ where: { studentId: session.user.id } }),
    prisma.studentProgress.findMany({ where: { studentId: session.user.id }, include: { game: { include: { vocabularySet: { include: { items: true } } } } }, orderBy: { completedAt: "asc" } }),
    prisma.studentBadge.findMany({ where: { studentId: session.user.id }, include: { badge: true } }),
  ]);

  // 30-day heatmap
  const heatmap: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    heatmap.push({ date: key, count: progress.filter((p) => p.completedAt.toDateString() === key).length });
  }

  // Skills radar from game types
  const bucket = (types: string[]) => {
    const rel = progress.filter((p) => types.includes(p.game.type));
    return rel.length ? Math.round(rel.reduce((s, p) => s + p.score, 0) / rel.length) : 0;
  };
  const skills = [
    { skill: "Vocabulary", value: bucket(["FLASHCARD", "MEMORY"]) },
    { skill: "Grammar", value: bucket(["FILL_BLANK", "DRAG_DROP"]) },
    { skill: "Listening", value: bucket(["DICTATION"]) },
    { skill: "Speaking", value: bucket(["QUIZ", "SPEED_ROUND"]) },
    { skill: "Writing", value: bucket(["STORY", "DICTATION"]) },
  ];

  // XP last 7 days
  const xpHistory: { day: string; xp: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    xpHistory.push({ day: d.toLocaleDateString("en-US", { weekday: "short" }), xp: progress.filter((p) => p.completedAt.toDateString() === key).reduce((s, p) => s + p.xpEarned, 0) });
  }

  // Words learned (distinct across played sets)
  const wordSet = new Map<string, string>();
  for (const p of progress) for (const i of p.game.vocabularySet.items) wordSet.set(i.id, `${i.word} — ${i.translation}`);
  const words = Array.from(wordSet.values());

  const level = xp?.level ?? 1;
  const earned = new Set(badges.map((b) => b.badge.name));

  return (
    <ProgressCharts
      totalXP={xp?.totalXP ?? 0}
      level={level}
      nextLevelXP={levelThreshold(level + 1)}
      prevLevelXP={levelThreshold(level)}
      streak={xp?.streak ?? 0}
      heatmap={heatmap}
      skills={skills}
      xpHistory={xpHistory}
      words={words}
      badges={BADGE_DEFS.map((b) => ({ name: b.name, description: b.description, earned: earned.has(b.name) }))}
    />
  );
}
