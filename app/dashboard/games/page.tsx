import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const typeEmoji: Record<string, string> = {
  FLASHCARD: "🃏", FILL_BLANK: "✏️", DRAG_DROP: "🧩", QUIZ: "❓",
  DICTATION: "🎧", MEMORY: "🧠", SPEED_ROUND: "⚡", STORY: "📖",
};

export default async function GamesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const games = await prisma.game.findMany({
    where: { educatorId: profile.id },
    include: { vocabularySet: { select: { name: true } }, _count: { select: { progress: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Games</h1>
        <Link href="/dashboard/games/new"><Button size="sm"><Plus className="h-4 w-4" /> New game</Button></Link>
      </div>
      {games.length === 0 ? (
        <EmptyState title="No games yet" description="Build an interactive game from one of your vocabulary sets." ctaLabel="Build game" ctaHref="/dashboard/games/new" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((g) => (
            <Link key={g.id} href={`/dashboard/games/${g.id}`}>
              <Card className="h-full">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{typeEmoji[g.type]}</span>
                    <Badge variant={g.isPublished ? "accent" : "outline"}>{g.isPublished ? "Published" : "Draft"}</Badge>
                  </div>
                  <h3 className="font-heading font-semibold">{g.title}</h3>
                  <p className="text-xs text-txt-secondary">{g.type.replace("_", " ")} · {g.vocabularySet.name} · {g._count.progress} plays</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
