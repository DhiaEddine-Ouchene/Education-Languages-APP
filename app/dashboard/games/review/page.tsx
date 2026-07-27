import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TYPE_LABELS } from "@/lib/game-type-metadata";
import { AlertTriangle, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const games = await prisma.game.findMany({
    where: { educatorId: profile.id, generationStatus: "needs_review" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl text-txt">Games Needing Review</h1>
          <p className="text-xs text-txt-secondary">
            {games.length} game{games.length !== 1 ? "s" : ""} with failed AI generation
          </p>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mb-4" />
          <h3 className="font-heading font-semibold text-lg text-txt mb-1">All caught up!</h3>
          <p className="text-sm text-txt-secondary max-w-sm">
            No games need review. AI-generated content that failed validation will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((g) => (
            <div key={g.id} className="rounded-xl border border-amber-200 bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-base text-txt">{g.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-txt-secondary">
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                      needs review
                    </Badge>
                    <span>{TYPE_LABELS[g.type] || g.type}</span>
                    <span>·</span>
                    <span>{new Date(g.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={`/api/games/${g.id}`} method="POST">
                    <input type="hidden" name="_method" value="DELETE" />
                    <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" /> Discard
                    </Button>
                  </form>
                  <Link href={`/dashboard/games/${g.id}`}>
                    <Button size="sm"><RotateCcw className="w-4 h-4" /> Edit</Button>
                  </Link>
                </div>
              </div>

              {g.generationError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Error:</p>
                  <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">{g.generationError}</pre>
                </div>
              )}

              {g.generationRaw && (
                <details className="group">
                  <summary className="text-xs font-medium text-txt-secondary cursor-pointer hover:text-txt">
                    View raw AI output
                  </summary>
                  <pre className="mt-2 text-xs text-txt-secondary bg-background rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
                    {JSON.stringify(g.generationRaw, null, 2)}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <form action="/api/games/regenerate" method="POST">
                  <input type="hidden" name="gameId" value={g.id} />
                  <Button variant="outline" size="sm">
                    <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                  </Button>
                </form>
                <form action="/api/games/mark-ready" method="POST">
                  <input type="hidden" name="gameId" value={g.id} />
                  <Button variant="outline" size="sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark as ready
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
