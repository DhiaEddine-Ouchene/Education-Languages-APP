import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/student/ProfileForm";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const [user, xp, gamesPlayed, badgeCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.studentXP.findUnique({ where: { studentId: session.user.id } }),
    prisma.studentProgress.count({ where: { studentId: session.user.id } }),
    prisma.studentBadge.count({ where: { studentId: session.user.id } }),
  ]);
  if (!user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Profile</h1>
      <Card><CardContent className="pt-5 flex items-center gap-4">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-16 w-16 rounded-pill object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-pill bg-primary text-white flex items-center justify-center font-heading font-bold text-xl">{user.name[0]}</div>
        )}
        <div>
          <p className="font-heading font-semibold text-lg">{user.name}</p>
          <p className="text-sm text-txt-secondary">{user.email}</p>
        </div>
      </CardContent></Card>
      <div className="grid grid-cols-4 gap-3 text-center">
        {[
          { v: xp?.level ?? 1, l: "Level" },
          { v: xp?.totalXP ?? 0, l: "Total XP" },
          { v: gamesPlayed, l: "Games" },
          { v: badgeCount, l: "Badges" },
        ].map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-4"><p className="font-heading font-bold text-xl">{s.v}</p><p className="text-xs text-txt-secondary">{s.l}</p></CardContent></Card>
        ))}
      </div>
      <ProfileForm name={user.name} />
    </div>
  );
}
