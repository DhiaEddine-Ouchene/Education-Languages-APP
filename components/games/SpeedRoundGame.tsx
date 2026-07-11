"use client";
import { useEffect, useMemo, useState } from "react";
import { type GameProps, shuffle } from "./types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Q = { word: string; shown: string; isTrue: boolean };

export function SpeedRoundGame({ items, onComplete }: GameProps) {
  const questions = useMemo<Q[]>(() => {
    const qs: Q[] = [];
    const pool = shuffle(items);
    for (let round = 0; round < 3; round++) {
      for (const i of pool) {
        const isTrue = Math.random() > 0.45;
        const wrong = pool.filter((x) => x.id !== i.id);
        const shown = isTrue || wrong.length === 0 ? i.translation : wrong[Math.floor(Math.random() * wrong.length)].translation;
        qs.push({ word: i.word, shown, isTrue: shown === i.translation });
      }
    }
    return shuffle(qs);
  }, [items]);

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const q = questions[idx % questions.length];

  useEffect(() => {
    if (timeLeft <= 0) { onComplete(correct, Math.max(answered, 1)); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (val: boolean) => {
    const ok = val === q.isTrue;
    setAnswered((a) => a + 1);
    setCorrect((c) => c + (ok ? 1 : 0));
    setStreak((s) => (ok ? s + 1 : 0));
    setFlash(ok ? "ok" : "bad");
    setTimeout(() => setFlash(null), 250);
    setIdx((i) => i + 1);
  };

  return (
    <div className={cn("max-w-md mx-auto space-y-6 rounded-card p-4 transition-colors", flash === "ok" && "bg-accent-light", flash === "bad" && "bg-red-50")}>
      <div className="flex justify-between items-center">
        <span className={cn("font-heading font-bold text-2xl", timeLeft <= 10 && "text-error")}>⏱ {timeLeft}s</span>
        <span className="text-warning font-semibold text-sm">🔥 streak x{streak}{streak >= 3 ? " (XP boost!)" : ""}</span>
        <span className="text-sm text-txt-secondary">✓ {correct}</span>
      </div>
      <div className="text-center py-6">
        <p className="font-heading font-bold text-3xl mb-1">{q.word}</p>
        <p className="text-txt-secondary">= “{q.shown}”?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="danger" size="lg" onClick={() => answer(false)}>False</Button>
        <Button variant="accent" size="lg" onClick={() => answer(true)}>True</Button>
      </div>
    </div>
  );
}
