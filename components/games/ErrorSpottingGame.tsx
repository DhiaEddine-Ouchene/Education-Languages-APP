"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type GameItem, shuffle } from "./types";
import { GameProgressBar } from "./GameProgressBar";

interface ErrorSpottingProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function ErrorSpottingGame({ items, settings, onComplete }: ErrorSpottingProps) {
  const deck = useMemo(() => (settings?.shuffle ? shuffle(items) : items), [items, settings?.shuffle]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const item = deck[idx];
  const sentenceWithError = (item as any).sentenceWithError || item.word;
  const wrongPart = (item as any).wrongPart || "";
  const correction = (item as any).correction || "";
  const ruleExplanation = (item as any).ruleExplanation || "";

  const hasGenerated = !!(item as any).wrongPart;

  // Split sentence into words for tap-targets
  const words = useMemo(() => String(sentenceWithError).split(/\s+/), [sentenceWithError]);

  const handleTapWord = (word: string) => {
    if (revealed) return;
    setSelectedPart(word);
    setAttempts(a => a + 1);

    if (hasGenerated && word.toLowerCase() === wrongPart.toLowerCase()) {
      setRevealed(true);
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) onComplete(score, deck.length);
    else { setIdx(i => i + 1); setSelectedPart(null); setAttempts(0); setRevealed(false); }
  };

  const handleGiveUp = () => {
    setRevealed(true);
  };

  if (!item) return null;

  if (!hasGenerated) {
    // Fallback: just show the sentence and mark as seen
    return (
      <div className="max-w-md mx-auto space-y-6 p-4 text-center">
        <GameProgressBar current={idx} total={deck.length} />
        <p className="font-heading font-semibold text-lg">{sentenceWithError}</p>
        <Button onClick={handleNext}><ArrowRight className="w-4 h-4 mr-2" /> Next</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <GameProgressBar current={idx} total={deck.length} />

      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Error Spotting</span>
        <h2 className="text-xl font-bold text-txt">Tap the word or phrase that contains the error.</h2>
      </div>

      {/* Sentence with tappable words */}
      <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm">
        <p className="text-lg leading-relaxed flex flex-wrap gap-1.5">
          {words.map((word, i) => {
            const isError = revealed && word.toLowerCase() === wrongPart.toLowerCase();
            const isSelected = selectedPart === word && !revealed;
            const isWrongPick = revealed && selectedPart === word && word.toLowerCase() !== wrongPart.toLowerCase();

            return (
              <button
                key={i}
                onClick={() => handleTapWord(word)}
                disabled={revealed}
                className={cn(
                  "px-1 rounded transition-all text-lg",
                  !revealed && "hover:bg-primary/10 hover:text-primary cursor-pointer",
                  isError && "bg-red-100 text-red-700 font-bold ring-2 ring-red-300",
                  isSelected && "bg-primary/10 text-primary font-semibold",
                  isWrongPick && "bg-amber-100 text-amber-700",
                  revealed && !isError && !isWrongPick && "opacity-60"
                )}
              >
                {isError && revealed ? (
                  <span>
                    <span className="line-through text-red-400">{wrongPart}</span>
                    {" → "}
                    <span className="text-green-600 font-bold">{correction}</span>
                  </span>
                ) : (
                  word
                )}
              </button>
            );
          })}
        </p>
      </div>

      {/* Feedback */}
      {revealed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <p className="text-green-800 font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {selectedPart?.toLowerCase() === wrongPart.toLowerCase()
              ? "Correct! You found the error."
              : `The error was "${wrongPart}" → "${correction}".`}
          </p>
          <p className="text-sm text-green-700">{ruleExplanation}</p>
        </div>
      )}

      {/* Wrong attempt feedback */}
      {selectedPart && !revealed && attempts > 0 && selectedPart.toLowerCase() !== wrongPart.toLowerCase() && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          That part is actually correct. Keep looking!
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3 pt-4">
        {!revealed ? (
          <>
            {attempts >= 2 && (
              <Button variant="outline" onClick={handleGiveUp}>
                Give up — show me
              </Button>
            )}
          </>
        ) : (
          <Button size="lg" onClick={handleNext} className="bg-green-600 hover:bg-green-700">
            {idx < deck.length - 1 ? "Next" : "Finish"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
