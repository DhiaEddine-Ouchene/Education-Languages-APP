"use client";
import { useMemo, useState } from "react";
import { GameProgressBar } from "./GameProgressBar";
import { type GameProps, shuffle } from "./types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DragDropGame({ items, settings, onComplete }: GameProps) {
  const deck = useMemo(() => (settings.shuffle ? shuffle(items) : items), [items, settings.shuffle]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const item = deck[idx];

  // Assemble a sentence from word tiles if available, otherwise the word from letter tiles
  const target = item.exampleSentence?.toLowerCase().includes(item.word.toLowerCase()) ? item.exampleSentence : item.word;
  const tiles = useMemo(() => {
    const parts = target.includes(" ") ? target.split(" ") : target.split("");
    return shuffle(parts.map((p, i) => ({ id: i, text: p })));
  }, [target]);

  const [placed, setPlaced] = useState<{ id: number; text: string }[]>([]);
  const [result, setResult] = useState<"ok" | "bad" | null>(null);
  const remaining = tiles.filter((t) => !placed.some((p) => p.id === t.id));
  const joiner = target.includes(" ") ? " " : "";

  const check = () => {
    const ok = placed.map((p) => p.text).join(joiner).toLowerCase() === target.toLowerCase();
    setResult(ok ? "ok" : "bad");
    if (ok) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (idx + 1 >= deck.length) return onComplete(correct + (result === "ok" && idx + 1 === deck.length ? 0 : 0), deck.length);
    setPlaced([]);
    setResult(null);
    setIdx(idx + 1);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <GameProgressBar current={idx} total={deck.length} />
      <p className="text-center text-sm text-txt-secondary">Assemble: <b>{item.translation}</b></p>
      <div
        className={cn(
          "min-h-16 border-2 border-dashed rounded-card p-3 flex flex-wrap gap-1.5 justify-center items-center",
          result === "ok" ? "border-accent bg-accent-light" : result === "bad" ? "border-error bg-red-50 animate-shake" : "border-border bg-card"
        )}
      >
        {placed.length === 0 && <span className="text-xs text-txt-secondary">Tap tiles below to place them here</span>}
        {placed.map((p) => (
          <button key={p.id} onClick={() => !result && setPlaced(placed.filter((x) => x.id !== p.id))} className="bg-primary text-white rounded-btn px-2.5 py-1.5 text-sm font-medium">{p.text}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {remaining.map((t) => (
          <button key={t.id} onClick={() => !result && setPlaced([...placed, t])} className="bg-card border border-border rounded-btn px-2.5 py-1.5 text-sm font-medium hover:bg-primary-light">{t.text}</button>
        ))}
      </div>
      {result === "bad" && <p className="text-sm text-center text-txt-secondary">Correct: <b>{target}</b></p>}
      {result == null ? (
        <Button className="w-full" onClick={check} disabled={remaining.length > 0}>Check</Button>
      ) : (
        <Button className="w-full" onClick={next}>{idx + 1 >= deck.length ? "Finish" : "Next"}</Button>
      )}
    </div>
  );
}
