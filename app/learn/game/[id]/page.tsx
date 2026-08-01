import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GamePlayer } from "@/components/games/GamePlayer";
import { adaptPlayItems } from "@/lib/adapt-generated-game";

export const dynamic = "force-dynamic";

export default async function GamePlayPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: {
      vocabularySet: { include: { items: true } },
      flashcardData: { include: { pairs: true } },
    },
  });
  if (!game) notFound();

  // For builder-created picture games, carry the uploaded images (stored on the
  // game's flashcard pairs) onto the play items so Picture-to-Word shows them.
  const pairImageByWord = new Map<string, string | null>();
  for (const p of game.flashcardData?.pairs ?? []) {
    if (p.word && p.imageUrl) pairImageByWord.set(p.word.toLowerCase(), p.imageUrl);
  }

  const vocabItems = (game.vocabularySet?.items ?? []).map((i) => ({
    id: i.id, word: i.word, translation: i.translation,
    audioUrl: i.audioUrl, imageUrl: pairImageByWord.get(i.word.toLowerCase()) ?? i.imageUrl, exampleSentence: i.exampleSentence,
  }));

  // Builder-created pair games (e.g. Picture-to-Word) carry their content on the
  // game's flashcard pairs rather than a vocabulary set — use those when present.
  const pairItems =
    game.flashcardData?.pairs?.length
      ? game.flashcardData.pairs.map((p, idx) => ({
          id: `pair-${idx}`, word: p.word, translation: p.translation,
          audioUrl: p.audioUrl, imageUrl: p.imageUrl, exampleSentence: p.exampleSentence,
        }))
      : null;

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
      type={game.type as any}
      items={adaptPlayItems(
        game.type as string,
        (game.settings ?? {}) as Record<string, any>,
        (pairItems ?? vocabItems)
      )}
      settings={(game.settings ?? {}) as Record<string, unknown>}
    />
  );
}
