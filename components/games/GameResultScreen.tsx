"use client";

import Link from "next/link";
import { Award, Clock, Flame, Home, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfettiOverlay } from "./ConfettiOverlay";

const getMessage = (score: number) => {
  if (score >= 90) return { icon: "🏆", title: "Excellent work!", text: "That was a polished performance." };
  if (score >= 70) return { icon: "👏", title: "Great progress!", text: "You are getting stronger with every round." };
  return { icon: "💪", title: "Keep practicing!", text: "Review the tricky words and try again." };
};

type Props = {
  score: number;
  xpEarned: number;
  timeTaken: number;
  streak: number;
  newBadges: string[];
  onPlayAgain: () => void;
  previewMode?: boolean;
};

export function GameResultScreen({ score, xpEarned, timeTaken, streak, newBadges, onPlayAgain, previewMode = false }: Props) {
  const message = getMessage(score);

  return (
    <div className="mx-auto max-w-2xl">
      <ConfettiOverlay fire={score > 80} />
      <Card className="overflow-hidden border-primary-light">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary via-primary-dark to-accent px-6 py-8 text-center text-white">
            <p className="mb-3 text-6xl drop-shadow-sm">{message.icon}</p>
            <h2 className="font-heading text-3xl font-bold">{message.title}</h2>
            <p className="mt-2 text-sm text-white/85">{previewMode ? "Teacher preview complete — nothing was saved." : message.text}</p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-card border border-border bg-primary-light p-4 text-center">
                <Trophy className="mx-auto mb-2 h-5 w-5 text-primary-dark" />
                <p className="font-heading text-2xl font-bold text-primary-dark">{Math.round(score)}%</p>
                <p className="text-xs font-medium text-txt-secondary">Accuracy</p>
              </div>
              <div className="relative overflow-hidden rounded-card border border-border bg-accent-light p-4 text-center">
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-accent" />
                <p className="font-heading text-2xl font-bold text-accent">+{xpEarned}</p>
                <p className="text-xs font-medium text-txt-secondary">XP earned</p>
                {!previewMode && <span className="absolute right-3 top-2 text-sm font-bold text-accent animate-flyup">+{xpEarned} XP</span>}
              </div>
              <div className="rounded-card border border-border bg-orange-50 p-4 text-center">
                <Clock className="mx-auto mb-2 h-5 w-5 text-warning" />
                <p className="font-heading text-2xl font-bold text-warning">{timeTaken}s</p>
                <p className="text-xs font-medium text-txt-secondary">Time taken</p>
              </div>
            </div>

            {!previewMode && (
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-card border border-border bg-background p-3 text-sm font-medium text-txt-secondary">
                <span className="inline-flex items-center gap-1 text-warning"><Flame className="h-4 w-4" /> {streak} day streak</span>
                {newBadges.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-primary-dark"><Award className="h-4 w-4" /> New badge{newBadges.length > 1 ? "s" : ""}: {newBadges.join(", ")}</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button variant="outline" onClick={onPlayAgain} className="w-full"><RotateCcw className="h-4 w-4" /> Play again</Button>
              {!previewMode && (
                <Link href="/learn" className="w-full"><Button className="w-full"><Sparkles className="h-4 w-4" /> Next game</Button></Link>
              )}
              <Link href={previewMode ? "/dashboard/games" : "/learn"} className={previewMode ? "sm:col-span-2 w-full" : "w-full"}>
                <Button variant="ghost" className="w-full"><Home className="h-4 w-4" /> {previewMode ? "Back to games" : "Home"}</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
