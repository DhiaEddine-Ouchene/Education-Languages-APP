import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GamePlayer } from "@/components/games/GamePlayer";

export const dynamic = "force-dynamic";

export default async function GamePlayPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: { vocabularySet: { include: { items: true } } },
  });
  if (!game) notFound();

  // Access: game must be published, or assigned to one of the student's classes
  if (!game.isPublished) {
    const assigned = await prisma.assignment.findFirst({
      where: { gameId: game.id, class: { members: { some: { studentId: session.user.id } } } },
    });
    if (!assigned) notFound();
  }

  return (
    <GamePlayer
      gameId={game.id}
      title={game.title}
      type={game.type}
      items={game.vocabularySet.items.map((i) => ({
        id: i.id, word: i.word, translation: i.translation,
        audioUrl: i.audioUrl, imageUrl: i.imageUrl, exampleSentence: i.exampleSentence,
      }))}
      settings={(game.settings ?? {}) as Record<string, unknown>}
    />
  );
}
