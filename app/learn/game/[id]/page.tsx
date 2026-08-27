import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GamePlayer } from "@/components/games/GamePlayer";
import { adaptPlayItems, mergeGameContent } from "@/lib/adapt-generated-game";

export const dynamic = "force-dynamic";

export default async function GamePlayPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: {
      flashcardData: { include: { pairs: true } },
      quizData: { include: { questions: true } },
      crosswordData: true,
      verbConjugationData: true,
      storyData: true,
    },
  });
  if (!game) notFound();

  const settings = mergeGameContent((game.settings ?? {}) as Record<string, any>, game);

  // For builder-created picture games, carry the uploaded images (stored on the
  // game's flashcard pairs) onto the play items so Picture-to-Word shows them.
  const pairImageByWord = new Map<string, string | null>();
  for (const p of game.flashcardData?.pairs ?? []) {
    if (p.word && p.imageUrl) pairImageByWord.set(p.word.toLowerCase(), p.imageUrl);
  }

  // Games own their content directly: on the flashcard pairs or in settings JSON.
  const pairItems =
    game.flashcardData?.pairs?.length
      ? game.flashcardData.pairs.map((p, idx) => ({
          id: `pair-${idx}`, word: p.word, translation: p.translation,
          audioUrl: p.audioUrl, imageUrl: pairImageByWord.get(p.word.toLowerCase()) ?? p.imageUrl, exampleSentence: p.exampleSentence,
        }))
      : (settings as any).pairs?.length
        ? (settings as any).pairs.map((p: any, idx: number) => ({
            id: `pair-${idx}`, word: p.word || "", translation: p.translation || "",
            audioUrl: null, imageUrl: null, exampleSentence: p.exampleSentence || null,
          }))
        : (settings as any).sentenceItems?.length
          ? (settings as any).sentenceItems.map((s: any, idx: number) => ({
              id: `sf-${idx}`, word: s.correctAnswer || "", translation: s.sentence || "",
              audioUrl: null, imageUrl: null, exampleSentence: s.sentence || null,
            }))
          : [];

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
        settings,
        pairItems
      )}
      settings={settings}
      student={{ name: session.user.name || "Student", image: session.user.image }}
    />
  );
}
