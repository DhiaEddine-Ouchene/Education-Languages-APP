"use client";
import { useMemo, useState } from "react";
import { GameProgressBar } from "./GameProgressBar";
import { type GameProps, shuffle } from "./types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FillBlankGame({ items, settings, onComplete }: GameProps) {
  const deck = useMemo(() => (settings.shuffle ? shuffle(items) : items), [items, settings.shuffle]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const item = deck[idx];

  const sentence = item.exampleSentence?.toLowerCase().includes(item.word.toLowerCase())
    ? item.exampleSentence.replace(new RegExp(item.word, "i"), "_____")
    : `“_____” means “${item.translation}”`;

  const options = useMemo(() => {
    const others = shuffle(deck.filter((i) => i.id !== item.id)).slice(0, 3).map((i) => i.word);
    return shuffle([item.word, ...others]);
  }, [item, deck]);

  const pick = (w: string) => {
    if (picked) return;
    setPicked(w);
    if (w === item.word) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (idx + 1 >= deck.length) return onComplete(correct, deck.length);
    setPicked(null);
    setIdx(idx + 1);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <GameProgressBar current={idx} total={deck.length} />
      <p className="font-heading font-semibold text-xl text-center">{sentence}</p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((w) => (
          <button
            key={w}
            onClick={() => pick(w)}
            className={cn(
              "border rounded-btn px-3 py-3 text-sm font-medium transition-colors",
              picked == null ? "border-border bg-card hover:bg-primary-light"
                : w === item.word ? "border-accent bg-accent-light text-accent"
                : w === picked ? "border-error bg-red-50 text-error animate-shake"
                : "border-border bg-card opacity-50"
            )}
          >
            {w}
          </button>
        ))}
      </div>
      {picked && picked !== item.word && (
        <p className="text-sm text-txt-secondary bg-primary-light rounded-card p-3">Correct answer: <b>{item.word}</b> — {item.translation}{item.exampleSentence ? `. Example: ${item.exampleSentence}` : ""}</p>
      )}
      {picked && <Button className="w-full" onClick={next}>{idx + 1 >= deck.length ? "Finish" : "Next"}</Button>}
    </div>
  );
}
