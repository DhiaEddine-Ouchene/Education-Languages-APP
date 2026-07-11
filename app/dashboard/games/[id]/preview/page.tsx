import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GamePlayer } from "@/components/games/GamePlayer";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PreviewGamePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const game = await prisma.game.findFirst({
    where: { id: params.id, educatorId: profile.id },
    include: { vocabularySet: { include: { items: true } } },
  });
  if (!game) notFound();

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
        type={game.type}
        items={game.vocabularySet.items.map((i) => ({
          id: i.id, word: i.word, translation: i.translation,
          audioUrl: i.audioUrl, imageUrl: i.imageUrl, exampleSentence: i.exampleSentence,
        }))}
        settings={(game.settings ?? {}) as Record<string, unknown>}
        previewMode
      />
    </div>
  );
}
