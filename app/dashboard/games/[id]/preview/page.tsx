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
      flashcardData: { include: { pairs: true } },
      quizData: { include: { questions: true } },
      crosswordData: true,
      verbConjugationData: true,
      storyData: true,
    },
  });
  if (!game) notFound();

  const settings = mergeGameContent((game.settings ?? {}) as Record<string, any>, game);

  // Games own their content directly: flashcard pairs or settings JSON.
  const pairItems =
    game.flashcardData?.pairs?.length
      ? game.flashcardData.pairs.map((p, idx) => ({
          id: `pair-${idx}`, word: p.word, translation: p.translation,
          audioUrl: p.audioUrl, imageUrl: p.imageUrl, exampleSentence: p.exampleSentence,
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

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Link
        href={`/dashboard/games/${game.id}`}
        className="inline-flex items-center gap-1 text-sm text-txt-secondary hover:text-primary transition-colors font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Back to editor
      </Link>
      <GamePlayer
        gameId={game.id}
        title={game.title}
        type={game.type as any}
        items={adaptPlayItems(game.type as string, settings, pairItems)}
        settings={settings}
        previewMode
        student={{ name: session.user.name || "Student", image: session.user.image }}
      />
    </div>
  );
}
