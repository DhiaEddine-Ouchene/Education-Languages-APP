"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/shared/EmptyState";
import { GamePreviewImage } from "@/components/dashboard/GamePreviewImage";
import { TYPE_LABELS } from "@/lib/game-type-metadata";
import { Plus, Gamepad2, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";

type GameRow = {
  id: string;
  title: string;
  type: string;
  isPublished: boolean;
  generationStatus?: string;
  generationError?: string | null;
  createdAt: Date;
  vocabularySet: { name: string } | null;
  _count: { progress: number };
};

type Props = {
  games: GameRow[];
  stats: { total: number; published: number; plays: number };
};

export function GamesGridClient({ games, stats }: Props) {
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});

  const handleRegenerate = async (g: GameRow) => {
    setRegenerating((prev) => ({ ...prev, [g.id]: true }));
    try {
      const content = g.vocabularySet?.name || g.title || "General vocabulary";
      const res = await fetch("/api/games/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: g.id, sourceContent: content, count: 8 }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", `"${g.title}" regenerated!`);
      } else if (data.status === "needs_review") {
        toast("info", `"${g.title}" needs review — check the review page`);
      }
    } catch (err: any) {
      toast("error", err.message || "Regeneration failed");
    } finally {
      setRegenerating((prev) => ({ ...prev, [g.id]: false }));
    }
  };

  const needsReviewCount = games.filter((g) => g.generationStatus === "needs_review").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-txt">Games</h1>
            <p className="text-xs text-txt-secondary">{stats.total} total · {stats.published} published · {stats.plays} plays</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {needsReviewCount > 0 && (
            <Link href="/dashboard/games/review">
              <Button variant="outline" size="sm" className="text-amber-600 border-amber-200">
                <AlertTriangle className="w-4 h-4" /> {needsReviewCount} need{needsReviewCount === 1 ? "s" : ""} review
              </Button>
            </Link>
          )}
          <Link href="/dashboard/games/new">
            <Button size="sm"><Plus className="w-4 h-4" /> New Game</Button>
          </Link>
        </div>
      </div>

      {/* Grid */}
      {games.length === 0 ? (
        <EmptyState title="No games yet" description="Create your first interactive learning game to get started."
          ctaLabel="Create game" ctaHref="/dashboard/games/new" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {games.map((g) => (
            <div key={g.id} className="group">
              <Link href={`/dashboard/games/${g.id}`}>
                <Card className="hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <GamePreviewImage type={g.type} title={g.title} className="w-full" />
                    <Badge variant={g.isPublished ? "accent" : "outline"}
                      className={cn("absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5",
                        g.isPublished && "bg-green-100 text-green-700 border-green-200")}>
                      {g.isPublished ? "Published" : "Draft"}
                    </Badge>
                    {g.generationStatus === "needs_review" && (
                      <Badge variant="outline" className="absolute top-2 left-2 text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                        needs review
                      </Badge>
                    )}
                  </div>
                  <CardContent className="pt-3 pb-4 px-4">
                    <h3 className="font-heading font-semibold text-sm text-txt group-hover:text-primary transition-colors truncate">
                      {g.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-txt-secondary">
                      <span>{TYPE_LABELS[g.type] || g.type.replace(/_/g, " ")}</span>
                      <span>·</span>
                      <span>{g._count.progress} {g._count.progress === 1 ? "play" : "plays"}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              {/* Regenerate button */}
              <button onClick={() => handleRegenerate(g)} disabled={regenerating[g.id]}
                className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-txt-secondary hover:text-primary rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50">
                {regenerating[g.id] ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                {regenerating[g.id] ? "Regenerating..." : "Regenerate with AI"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
