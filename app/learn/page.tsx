import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelThreshold } from "@/lib/xp";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XPBar, StreakBadge } from "@/components/student/XPBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LearnHomePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const [xp, memberships, progress] = await Promise.all([
    prisma.studentXP.findUnique({ where: { studentId: session.user.id } }),
    prisma.classMember.findMany({
      where: { studentId: session.user.id },
      include: { class: { include: { assignments: { include: { game: true }, orderBy: { dueDate: "asc" } }, educator: true } } },
    }),
    prisma.studentProgress.findMany({ where: { studentId: session.user.id }, include: { game: true }, orderBy: { completedAt: "desc" } }),
  ]);

  const completedGameIds = new Set(progress.map((p) => p.gameId));
  const now = new Date();
  const assignments = memberships.flatMap((m) => m.class.assignments.map((a) => ({ ...a, className: m.class.name })));
  const liveNow = assignments.filter((a) => a.isLive && a.dueDate > now);
  const todo = assignments.filter((a) => !a.isLive && a.dueDate >= new Date(now.getTime() - 24 * 3600 * 1000) && !completedGameIds.has(a.gameId));
  const lastPlayed = progress[0];

  const educatorIds = Array.from(new Set(memberships.map((m) => m.class.educator.id)));
  const practice = await prisma.game.findMany({
    where: educatorIds.length ? { educatorId: { in: educatorIds }, isPublished: true } : { isPublished: true },
    take: 9,
    orderBy: { createdAt: "desc" },
  });

  const level = xp?.level ?? 1;

  return (
    <div className="space-y-6">
      {/* Streak + XP */}
      <Card className="bg-primary text-white border-0">
        <CardContent className="pt-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-heading font-bold text-lg">Hi {session.user.name?.split(" ")[0]}! 👋</p>
            <p className="text-sm opacity-80">{xp?.streak ? "Keep your streak alive today!" : "Play a game to start your streak!"}</p>
          </div>
          <StreakBadge days={xp?.streak ?? 0} />
        </CardContent>
      </Card>
      <Card><CardContent className="pt-5">
        <XPBar totalXP={xp?.totalXP ?? 0} level={level} nextLevelXP={levelThreshold(level + 1)} prevLevelXP={levelThreshold(level)} />
      </CardContent></Card>

      {/* Live sessions */}
      {liveNow.map((a) => (
        <Card key={a.id} className="border-error border-2">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <Badge variant="error">🔴 LIVE</Badge>
              <p className="font-heading font-semibold mt-1">{a.game.title}</p>
              <p className="text-xs text-txt-secondary">{a.className} · join now!</p>
            </div>
            <Link href={`/learn/game/${a.gameId}`}><Button variant="danger">Join live</Button></Link>
          </CardContent>
        </Card>
      ))}

      {/* Assignments */}
      <section>
        <h2 className="font-heading font-semibold text-lg mb-2">To do</h2>
        {todo.length === 0 ? (
          <p className="text-sm text-txt-secondary">🎉 All caught up! Nothing due.</p>
        ) : (
          <div className="space-y-2">
            {todo.map((a) => (
              <Card key={a.id}><CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{a.game.title}</p>
                  <p className="text-xs text-txt-secondary">{a.className} · due {formatDate(a.dueDate)}</p>
                </div>
                <Link href={`/learn/game/${a.gameId}`}><Button size="sm">Play</Button></Link>
              </CardContent></Card>
            ))}
          </div>
        )}
      </section>

      {/* Continue learning */}
      {lastPlayed && (
        <section>
          <h2 className="font-heading font-semibold text-lg mb-2">Continue learning</h2>
          <Card><CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{lastPlayed.game.title}</p>
              <p className="text-xs text-txt-secondary">Last score: {Math.round(lastPlayed.score)}%</p>
            </div>
            <Link href={`/learn/game/${lastPlayed.gameId}`}><Button size="sm" variant="accent">Resume</Button></Link>
          </CardContent></Card>
        </section>
      )}

      {/* Free practice */}
      <section>
        <h2 className="font-heading font-semibold text-lg mb-2">Free practice</h2>
        {practice.length === 0 ? (
          <EmptyState title="No games available yet" description="Join a class with an invite code to unlock games from your teacher." ctaLabel="Join a class" ctaHref="/learn/classes" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {practice.map((g) => (
              <Link key={g.id} href={`/learn/game/${g.id}`}>
                <Card className="h-full"><CardContent className="pt-4 text-center">
                  <p className="text-2xl mb-1">{{ FLASHCARD: "🃏", FILL_BLANK: "✏️", DRAG_DROP: "🧩", QUIZ: "❓", DICTATION: "🎧", MEMORY: "🧠", SPEED_ROUND: "⚡", STORY: "📖" }[g.type]}</p>
                  <p className="text-sm font-medium">{g.title}</p>
                </CardContent></Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
