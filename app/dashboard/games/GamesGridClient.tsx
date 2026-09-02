"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/shared/EmptyState";
import { GamePoster } from "@/components/dashboard/GamePoster";
import { TYPE_LABELS } from "@/lib/game-type-metadata";
import { Plus, Gamepad2, RotateCcw, AlertTriangle, Loader2, Edit, Trash2, Eye } from "lucide-react";

type GameRow = {
  id: string;
  title: string;
  type: string;
  isPublished: boolean;
  generationStatus?: string;
  generationError?: string | null;
  createdAt: Date;
  _count: { progress: number };
};

type Props = {
  games: GameRow[];
  stats: { total: number; published: number; plays: number };
};

export function GamesGridClient({ games, stats }: Props) {
  const router = useRouter();
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (gameId: string, title: string) => {
    if (deleteConfirm !== gameId) {
      setDeleteConfirm(gameId);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    setDeleting((prev) => ({ ...prev, [gameId]: true }));
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error || "Failed to delete game");
        return;
      }

      toast("success", `"${title}" deleted`);
      router.refresh();
    } catch (err: any) {
      toast("error", err.message || "Failed to delete game");
    } finally {
      setDeleting((prev) => ({ ...prev, [gameId]: false }));
      setDeleteConfirm(null);
    }
  };

  const handleRegenerate = async (g: GameRow) => {
    setRegenerating((prev) => ({ ...prev, [g.id]: true }));
    try {
      const content = g.title || "General vocabulary";
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
            <div key={g.id} className="group flex flex-col">
              <Card className="hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden flex-1 flex flex-col">
                <div className="relative">
                  <GamePoster type={g.type} title={g.title} className="w-full" />
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
                <CardContent className="pt-3 pb-3 px-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-sm text-txt group-hover:text-primary transition-colors truncate">
                      {g.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-txt-secondary">
                      <span>{TYPE_LABELS[g.type] || g.type.replace(/_/g, " ")}</span>
                      <span>·</span>
                      <span>{g._count.progress} {g._count.progress === 1 ? "play" : "plays"}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Link href={`/learn/game/${g.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </Link>
                    <Link href={`/dashboard/games/${g.id}`} className="flex-1">
                      <Button size="sm" variant="primary" className="w-full text-xs">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(g.id, g.title)}
                      disabled={deleting[g.id]}
                      className={cn(
                        "px-2",
                        deleteConfirm === g.id
                          ? "text-error hover:bg-error/20 border border-error"
                          : "text-txt-secondary hover:text-error hover:bg-error/10"
                      )}
                      title={deleteConfirm === g.id ? "Click again to confirm deletion" : "Delete game"}
                    >
                      {deleting[g.id] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
