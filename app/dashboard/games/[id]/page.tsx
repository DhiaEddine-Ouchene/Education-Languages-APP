import { notFound, redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GameBuilder } from "@/components/dashboard/GameBuilder";

export const dynamic = "force-dynamic";

export default async function EditGamePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const game = await prisma.game.findFirst({
    where: { id: params.id, educatorId: profile.id },
    include: { flashcardData: { include: { pairs: true } } },
  });
  if (!game) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Edit game</h1>
      <GameBuilder
        initial={{
          id: game.id,
          title: game.title,
          type: game.type,
          settings: (game.settings ?? {}) as Record<string, unknown>,
          flashcardPairs: game.flashcardData?.pairs?.map((p) => ({
            word: p.word, translation: p.translation, exampleSentence: p.exampleSentence,
            audioUrl: p.audioUrl, imageUrl: p.imageUrl,
          })) ?? [],
          isPublished: game.isPublished,
        }}
      />
    </div>
  );
}
