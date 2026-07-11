"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfettiOverlay } from "./ConfettiOverlay";

type Props = {
  score: number;
  xpEarned: number;
  timeTaken: number;
  streak: number;
  newBadges: string[];
  onPlayAgain: () => void;
};

export function GameResultScreen({ score, xpEarned, timeTaken, streak, newBadges, onPlayAgain }: Props) {
  return (
    <div className="max-w-md mx-auto">
      <ConfettiOverlay fire={score > 80} />
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <p className="text-5xl">{score >= 80 ? "🏆" : score >= 50 ? "👏" : "💪"}</p>
          <h2 className="font-heading font-bold text-2xl">{score >= 80 ? "Amazing!" : score >= 50 ? "Well done!" : "Keep practicing!"}</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-primary-light rounded-card p-3"><p className="font-heading font-bold text-xl">{Math.round(score)}%</p><p className="text-xs text-txt-secondary">Accuracy</p></div>
            <div className="bg-accent-light rounded-card p-3 relative overflow-visible">
              <p className="font-heading font-bold text-xl text-accent">+{xpEarned}</p><p className="text-xs text-txt-secondary">XP earned</p>
              <span className="absolute -top-2 right-2 text-accent font-bold text-sm animate-flyup">+{xpEarned} XP</span>
            </div>
            <div className="bg-orange-50 rounded-card p-3"><p className="font-heading font-bold text-xl text-warning">{timeTaken}s</p><p className="text-xs text-txt-secondary">Time</p></div>
          </div>
          <p className="text-sm text-warning font-medium">🔥 {streak} day streak</p>
          {newBadges.length > 0 && (
            <div className="bg-primary-light rounded-card p-3 text-sm">🏅 New badge{newBadges.length > 1 ? "s" : ""}: <b>{newBadges.join(", ")}</b></div>
          )}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onPlayAgain}>Play again</Button>
            <Link href="/learn"><Button size="sm" className="w-full">Next game</Button></Link>
            <Link href="/learn"><Button variant="ghost" size="sm" className="w-full">Home</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
