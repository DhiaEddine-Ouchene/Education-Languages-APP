import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UnifiedGameCreator } from "@/components/dashboard/UnifiedGameCreator";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const sets = await prisma.vocabularySet.findMany({
    where: { educatorId: profile.id },
    include: { items: { select: { id: true, word: true, translation: true, exampleSentence: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <UnifiedGameCreator
        educatorId={profile.id}
        existingSets={sets.map((s) => ({
          id: s.id,
          name: s.name,
          items: s.items.map((i) => ({
            id: i.id,
            word: i.word,
            translation: i.translation,
            exampleSentence: i.exampleSentence ?? undefined,
          })),
        }))}
      />
    </div>
  );
}
