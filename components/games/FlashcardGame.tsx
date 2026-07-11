"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameProgressBar } from "./GameProgressBar";
import { type GameProps, shuffle, playAudio } from "./types";
import { Volume2 } from "lucide-react";

export function FlashcardGame({ items, settings, onComplete }: GameProps) {
  const deck = useMemo(() => (settings.shuffle ? shuffle(items) : items), [items, settings.shuffle]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const card = deck[idx];

  const answer = (knew: boolean) => {
    const nextKnown = known + (knew ? 1 : 0);
    if (idx + 1 >= deck.length) return onComplete(nextKnown, deck.length);
    setKnown(nextKnown);
    setFlipped(false);
    setIdx(idx + 1);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <GameProgressBar current={idx} total={deck.length} />
      <div className={`card-flip h-56 cursor-pointer ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
        <div className="card-flip-inner h-full">
          <div className="card-face bg-card border border-border rounded-card shadow-card flex flex-col items-center justify-center gap-3">
            <p className="font-heading font-bold text-3xl">{card.word}</p>
            <button onClick={(e) => { e.stopPropagation(); playAudio(card); }} aria-label="Play audio"><Volume2 className="h-6 w-6 text-primary" /></button>
            <p className="text-xs text-txt-secondary">Tap to flip</p>
          </div>
          <div className="card-face card-back bg-primary text-white rounded-card flex flex-col items-center justify-center gap-2">
            <p className="font-heading font-bold text-3xl">{card.translation}</p>
            {card.exampleSentence && <p className="text-sm opacity-80 px-6 text-center italic">{card.exampleSentence}</p>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => answer(false)}>Don&apos;t know it</Button>
        <Button variant="accent" onClick={() => answer(true)}>Know it ✓</Button>
      </div>
    </div>
  );
}
