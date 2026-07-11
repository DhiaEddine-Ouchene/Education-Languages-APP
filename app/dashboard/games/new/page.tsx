import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GameBuilder } from "@/components/dashboard/GameBuilder";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");
  const sets = await prisma.vocabularySet.findMany({
    where: { educatorId: profile.id },
    include: { items: { select: { id: true, word: true, translation: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Build game</h1>
      <GameBuilder sets={sets} />
    </div>
  );
}
