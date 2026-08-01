import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GamePlayer } from "@/components/games/GamePlayer";
import { adaptPlayItems } from "@/lib/adapt-generated-game";
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
      vocabularySet: { include: { items: true } },
      flashcardData: { include: { pairs: true } },
    },
  });
  if (!game) notFound();

  const pairItems =
    game.flashcardData?.pairs?.length
      ? game.flashcardData.pairs.map((p, idx) => ({
          id: `pair-${idx}`, word: p.word, translation: p.translation,
          audioUrl: p.audioUrl, imageUrl: p.imageUrl, exampleSentence: p.exampleSentence,
        }))
      : (game.vocabularySet?.items ?? []).map((i) => ({
          id: i.id, word: i.word, translation: i.translation,
          audioUrl: i.audioUrl, imageUrl: i.imageUrl, exampleSentence: i.exampleSentence,
        }));

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
        items={adaptPlayItems(game.type as string, (game.settings ?? {}) as Record<string, any>, pairItems)}
        settings={(game.settings ?? {}) as Record<string, unknown>}
        previewMode
      />
    </div>
  );
}
