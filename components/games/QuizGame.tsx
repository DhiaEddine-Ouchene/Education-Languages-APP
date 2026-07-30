"use client";
import { useEffect, useMemo, useState } from "react";
import { GameProgressBar } from "./GameProgressBar";
import { type GameProps, shuffle } from "./types";
import { cn } from "@/lib/utils";

export function QuizGame({ items, settings, onComplete }: GameProps) {
  const deck = useMemo(() => (settings.shuffle ? shuffle(items) : items), [items, settings.shuffle]);
  const limit = settings.timer ?? 30;
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(limit);
  const item = deck[idx];

  // Use generated fields when available, fallback to old behavior
  const hasGeneratedContent = !!(item.question && item.options?.length && item.correctOption);

  const questionText = hasGeneratedContent ? item.question : `What does "${item.word}" mean?`;

  const options = useMemo(() => {
    if (hasGeneratedContent) {
      return item.options!;
    }
    // Fallback: derive from sibling items
    const others = shuffle(deck.filter((i) => i.id !== item.id)).slice(0, 3).map((i) => i.translation);
    return shuffle([item.translation, ...others]);
  }, [item, deck, hasGeneratedContent]);

  const correctAnswer = hasGeneratedContent ? item.correctOption! : item.translation;
  const explanation = hasGeneratedContent ? item.explanation : null;

  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (picked) return;
    if (timeLeft <= 0) { setPicked("__timeout__"); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, picked]);

  useEffect(() => {
    if (!picked) return;
    setIsCorrect(picked === correctAnswer);
    if (picked === correctAnswer) setCorrect((c) => c + 1);
    // Show explanation briefly before advancing
    setShowExplanation(true);
    const t = setTimeout(() => {
      setShowExplanation(false);
      if (idx + 1 >= deck.length) onComplete(correct + (picked === correctAnswer ? 1 : 0), deck.length);
      else { setPicked(null); setTimeLeft(limit); setIdx((i) => i + 1); }
    }, 2000);
    return () => clearTimeout(t);
  }, [picked]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (o: string) => {
    if (picked) return;
    setPicked(o);
  };

  const pct = timeLeft / limit;
  return (
    <div className="max-w-md mx-auto space-y-6">
      <GameProgressBar current={idx} total={deck.length} />
      <div className="flex justify-center">
        <div className="relative h-16 w-16">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" stroke={pct < 0.3 ? "var(--error)" : "var(--primary)"} strokeWidth="3" strokeDasharray={`${pct * 100.5} 100.5`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-heading font-bold">{timeLeft}</span>
        </div>
      </div>

      <p className="font-heading font-semibold text-xl text-center">{questionText}</p>

      <div className="grid grid-cols-1 gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => pick(o)}
            className={cn(
              "border rounded-btn px-3 py-3 text-sm font-medium text-left transition-colors",
              picked == null ? "border-border bg-card hover:bg-primary-light"
                : o === correctAnswer ? "border-accent bg-accent-light text-accent"
                : o === picked ? "border-error bg-red-50 text-error animate-shake"
                : "border-border bg-card opacity-50"
            )}
          >
            {o}
          </button>
        ))}
      </div>

      {showExplanation && explanation && (
        <div className={cn(
          "rounded-btn p-3 text-sm border",
          isCorrect ? "bg-accent-light border-accent text-accent" : "bg-red-50 border-error text-error"
        )}>
          <p className="font-semibold">{isCorrect ? "✓ Correct" : "✗ Incorrect"}</p>
          <p className="mt-1 opacity-80">{explanation}</p>
        </div>
      )}
    </div>
  );
}
