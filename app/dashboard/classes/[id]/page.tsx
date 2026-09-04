import { notFound, redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClassDetail } from "@/components/dashboard/ClassDetail";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const cls = await prisma.class.findFirst({
    where: { id: params.id, educatorId: profile.id },
    include: {
      members: { include: { student: { include: { xp: true } } } },
      assignments: { include: { game: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!cls) notFound();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const studentIds = cls.members.map((m) => m.studentId);
  let games: any[] = [];
  let courses: any[] = [];
  let weeklyXP: any[] = [];
  let completions: any[] = [];

  try {
    const [gamesRes, coursesRes] = await Promise.allSettled([
      prisma.game.findMany({ where: { educatorId: profile.id }, select: { id: true, title: true } }),
      prisma.course.findMany({ where: { educatorId: profile.id, isPublished: true }, select: { id: true, title: true } }),
    ]);
    if (gamesRes.status === "fulfilled") games = gamesRes.value;
    if (coursesRes.status === "fulfilled") courses = coursesRes.value;

    if (studentIds.length > 0) {
      const [weeklyXPRes, completionsRes] = await Promise.allSettled([
        prisma.studentProgress.groupBy({
          by: ["studentId"],
          where: { studentId: { in: studentIds }, completedAt: { gte: weekAgo } },
          _sum: { xpEarned: true },
        }),
        prisma.studentProgress.groupBy({
          by: ["gameId"],
          where: { studentId: { in: studentIds }, gameId: { in: cls.assignments.map((a) => a.gameId) } },
          _count: { studentId: true },
        }),
      ]);

      if (weeklyXPRes.status === "fulfilled") weeklyXP = weeklyXPRes.value;
      else console.error("[dashboard:class:weeklyXP] Query failed:", weeklyXPRes.reason);

      if (completionsRes.status === "fulfilled") completions = completionsRes.value;
      else console.error("[dashboard:class:completions] Query failed:", completionsRes.reason);
    }
  } catch (err) {
    console.error("[dashboard:class:detail] Secondary queries failed:", err);
  }

  const leaderboard = cls.members
    .map((m) => ({ name: m.student.name, xp: weeklyXP.find((w: any) => w.studentId === m.studentId)?._sum?.xpEarned ?? 0 }))
    .sort((a, b) => b.xp - a.xp);

  return (
    <ClassDetail
      cls={{
        id: cls.id, name: cls.name, language: cls.language, level: cls.level, inviteCode: cls.inviteCode,
        members: cls.members.map((m) => ({
          id: m.id, studentId: m.studentId, name: m.student.name, email: m.student.email, joinedAt: m.joinedAt.toISOString(),
          totalXP: m.student.xp?.totalXP ?? 0, level: m.student.xp?.level ?? 1, streak: m.student.xp?.streak ?? 0,
        })),
        assignments: cls.assignments.map((a) => ({
          id: a.id, gameTitle: a.game.title, dueDate: a.dueDate.toISOString(), isLive: a.isLive,
          completions: completions.find((c) => c.gameId === a.gameId)?._count.studentId ?? 0,
        })),
      }}
      games={games}
      courses={courses}
      leaderboard={leaderboard}
    />
  );
}
