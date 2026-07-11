"use client";
import { useEffect, useMemo, useState } from "react";
import { type GameProps, shuffle } from "./types";
import { cn } from "@/lib/utils";

type MemCard = { key: number; pairId: string; text: string };

export function MemoryGame({ items, onComplete }: GameProps) {
  const cards = useMemo<MemCard[]>(() => {
    const chosen = shuffle(items).slice(0, 6);
    return shuffle(chosen.flatMap((i, n) => [
      { key: n * 2, pairId: i.id, text: i.word },
      { key: n * 2 + 1, pairId: i.id, text: i.translation },
    ]));
  }, [items]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const totalPairs = cards.length / 2;

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped.map((k) => cards.find((c) => c.key === k)!);
    setMoves((m) => m + 1);
    if (a.pairId === b.pairId && a.key !== b.key) {
      setMatched((m) => [...m, a.pairId]);
      setFlipped([]);
    } else {
      const t = setTimeout(() => setFlipped([]), 900);
      return () => clearTimeout(t);
    }
  }, [flipped, cards]);

  useEffect(() => {
    if (matched.length === totalPairs && totalPairs > 0) {
      // Score based on efficiency: perfect = pairs moves, each extra move costs points
      const efficiency = Math.max(0, Math.min(1, totalPairs / Math.max(moves, 1)));
      const correct = Math.round(efficiency * totalPairs);
      const t = setTimeout(() => onComplete(Math.max(correct, 1), totalPairs), 800);
      return () => clearTimeout(t);
    }
  }, [matched, totalPairs, moves, onComplete]);

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex justify-between text-sm text-txt-secondary">
        <span>Matches: {matched.length}/{totalPairs}</span>
        <span>Moves: {moves}</span>
        <span>⏱ {seconds}s</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => {
          const isUp = flipped.includes(c.key) || matched.includes(c.pairId);
          return (
            <button
              key={c.key}
              onClick={() => { if (!isUp && flipped.length < 2) setFlipped((f) => [...f, c.key]); }}
              className={cn(
                "h-20 rounded-card text-xs font-medium px-1 transition-all",
                isUp ? (matched.includes(c.pairId) ? "bg-accent-light text-accent border border-accent" : "bg-card border border-primary") : "bg-primary"
              )}
            >
              {isUp ? c.text : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
