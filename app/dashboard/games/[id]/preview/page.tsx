import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GamePlayer } from "@/components/games/GamePlayer";
import { adaptPlayItems, mergeGameContent } from "@/lib/adapt-generated-game";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PreviewGamePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const game = await prisma.game.findFirst({
    where: { id: params.id, educatorId: profile.id },
    include: {
      exerciseSet: true,
      flashcardData: { include: { pairs: true } },
      quizData: { include: { questions: true } },
      crosswordData: true,
      verbConjugationData: true,
      storyData: true,
    },
  });
  if (!game) notFound();

  const settings = mergeGameContent((game.settings ?? {}) as Record<string, any>, game);

  // Carry uploaded images onto play items
  const pairImageByWord = new Map<string, string | null>();
  for (const p of game.flashcardData?.pairs ?? []) {
    if (p.word && p.imageUrl) pairImageByWord.set(p.word.toLowerCase(), p.imageUrl);
  }

  // Games own their content directly: on flashcard pairs, in settings JSON, settings.data, or exerciseSet items.
  const data = (settings as any).data;
  const rawItems =
    (settings as any).items ||
    (settings as any).pairs ||
    data?.items ||
    data?.pairs ||
    (settings as any).generated?.items;

  const pairItems =
    game.flashcardData?.pairs?.length
      ? game.flashcardData.pairs.map((p, idx) => ({
          id: `pair-${idx}`,
          word: p.word,
          translation: p.translation,
          audioUrl: p.audioUrl,
          imageUrl: pairImageByWord.get(p.word.toLowerCase()) ?? p.imageUrl,
          exampleSentence: p.exampleSentence,
        }))
      : Array.isArray(rawItems) && rawItems.length
        ? rawItems.map((p: any, idx: number) => ({
            id: `item-${idx}`,
            word: p.word || p.correctSentence || p.sentenceWithBlank || p.question || p.verb || p.term || "",
            translation: p.translation || p.correctWord || p.correctOption || p.clue || p.hint || p.definition || "",
            audioUrl: p.audioUrl || null,
            imageUrl: p.imageUrl || null,
            exampleSentence: p.exampleSentence || null,
          }))
        : Array.isArray(game.exerciseSet?.items) && (game.exerciseSet!.items as any[]).length
          ? (game.exerciseSet!.items as any[]).map((p: any, idx: number) => ({
              id: `es-${idx}`,
              word: p.word || p.term || p.front || "",
              translation: p.translation || p.definition || p.back || "",
              audioUrl: null,
              imageUrl: null,
              exampleSentence: p.exampleSentence || null,
            }))
          : (settings as any).sentenceItems?.length
            ? (settings as any).sentenceItems.map((s: any, idx: number) => ({
                id: `sf-${idx}`,
                word: s.correctAnswer || "",
                translation: s.sentence || "",
                audioUrl: null,
                imageUrl: null,
                exampleSentence: s.sentence || null,
              }))
            : [];

  return (
    <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto px-1 sm:px-4 py-1 sm:py-4">
      <Link
        href={`/dashboard/games/${game.id}`}
        className="inline-flex items-center gap-1 text-xs sm:text-sm text-txt-secondary hover:text-primary transition-colors font-medium px-1"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back to editor
      </Link>
      <GamePlayer
        gameId={game.id}
        title={game.title}
        type={game.type as any}
        items={adaptPlayItems(game.type as string, settings, pairItems)}
        settings={settings}
        previewMode
        student={{ name: session.user.name || "Teacher", image: session.user.image }}
      />
    </div>
  );
}
