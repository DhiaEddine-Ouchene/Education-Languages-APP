"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type GameItem, shuffle } from "./types";
import { GameProgressBar } from "./GameProgressBar";

interface CollocationBuilderProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function CollocationBuilderGame({ items, settings, onComplete }: CollocationBuilderProps) {
  const deck = settings?.shuffle ? shuffle(items) : items;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [correctPicks, setCorrectPicks] = useState<string[]>([]);
  const [wrongPicks, setWrongPicks] = useState<string[]>([]);
  const [allPartnerOptions, setAllPartnerOptions] = useState<string[]>([]);

  const currentItem = deck[currentIndex];

  useEffect(() => {
    if (!currentItem) return;

    // Use generated fields when available
    const correct = (currentItem as any).correctPartners;
    const wrong = (currentItem as any).wrongPartners;

    if (Array.isArray(correct) && correct.length > 0 && Array.isArray(wrong) && wrong.length > 0) {
      setAllPartnerOptions(shuffle([...correct, ...wrong]));
    } else {
      // Fallback — use sibling items as options
      const others = deck.filter((_, i) => i !== currentIndex).slice(0, 5).map(i => i.word);
      setAllPartnerOptions(shuffle(others));
    }

    setSelected(new Set());
    setSubmitted(false);
    setCorrectPicks([]);
    setWrongPicks([]);
  }, [currentIndex, deck, currentItem]);

  const toggle = (opt: string) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  const submitAnswer = () => {
    if (submitted || selected.size === 0) return;

    const correctPartners: string[] = (currentItem as any).correctPartners || [];
    const wrongPartners: string[] = (currentItem as any).wrongPartners || [];

    // In fallback mode (no correctPartners), just check against first sibling
    if (correctPartners.length === 0) {
      const isCorrect = selected.size === 1 && selected.has(deck[0]?.word || "");
      if (isCorrect) setScore(s => s + 1);
      setSubmitted(true);
      return;
    }

    const correct = correctPartners.filter(c => selected.has(c));
    const wrong = Array.from(selected).filter(s => wrongPartners.includes(s));
    const missed = correctPartners.filter(c => !selected.has(c));

    setCorrectPicks(correct);
    setWrongPicks(wrong);
    setSubmitted(true);

    // Score: all correct partners selected, no wrong partners selected
    if (missed.length === 0 && wrong.length === 0) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onComplete(score, deck.length);
    }
  };

  if (!currentItem) return null;

  const baseWord = (currentItem as any).baseWord || currentItem.word;
  const correctPartners: string[] = (currentItem as any).correctPartners || [];
  const wrongPartners: string[] = (currentItem as any).wrongPartners || [];
  const hasGeneratedContent = correctPartners.length > 0 && wrongPartners.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <GameProgressBar current={currentIndex} total={deck.length} />

      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Collocation Builder</span>
        <h2 className="text-2xl font-bold text-txt">Select ALL words that naturally pair with:</h2>
      </div>

      {/* Base Word */}
      <div className="bg-primary p-8 rounded-xl text-center shadow-lg">
        <span className="text-xs font-bold text-white/80 mb-2 uppercase tracking-wider block">Base Word</span>
        <div className="text-4xl font-bold text-white capitalize">{baseWord}</div>
      </div>

      {/* Partner Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allPartnerOptions.map((opt) => {
          const isSelected = selected.has(opt);
          const isCorrectPartner = submitted && correctPicks.includes(opt);
          const isWrongPick = submitted && wrongPicks.includes(opt);
          const isMissed = submitted && correctPartners.includes(opt) && !selected.has(opt);

          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              disabled={submitted}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all font-medium",
                !submitted && isSelected && "border-primary bg-primary/5 shadow-md",
                !submitted && !isSelected && "border-border bg-card hover:border-primary/40",
                isCorrectPartner && "border-green-500 bg-green-50 text-green-800",
                isWrongPick && "border-red-500 bg-red-50 text-red-800",
                isMissed && "border-orange-300 bg-orange-50 text-orange-700",
                submitted && !isCorrectPartner && !isWrongPick && !isMissed && "opacity-40"
              )}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {isCorrectPartner && <CheckCircle className="w-5 h-5 text-green-500" />}
                {isWrongPick && <XCircle className="w-5 h-5 text-red-500" />}
                {isMissed && <span className="text-orange-500 text-sm font-bold">Missed</span>}
                {!submitted && (
                  <div className={cn("w-5 h-5 rounded border-2", isSelected ? "bg-primary border-primary" : "border-border")}>
                    {isSelected && <span className="text-white flex items-center justify-center text-xs">✓</span>}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {submitted && hasGeneratedContent && (
        <div className={cn(
          "rounded-xl p-4 border text-sm space-y-1",
          correctPicks.length === correctPartners.length && wrongPicks.length === 0
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        )}>
          <p className="font-semibold">
            {correctPicks.length === correctPartners.length && wrongPicks.length === 0
              ? "✓ Perfect! All correct collocations."
              : "Not quite right."}
          </p>
          <p>Correct partners: {correctPartners.join(", ")}</p>
          {wrongPicks.length > 0 && <p>Wrong picks: {wrongPicks.join(", ")} — these don't naturally pair with "{baseWord}".</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center pt-4">
        {!submitted ? (
          <Button size="lg" disabled={selected.size === 0} onClick={submitAnswer}>
            <CheckCircle className="w-5 h-5 mr-2" /> Check ({selected.size} selected)
          </Button>
        ) : (
          <Button size="lg" onClick={handleNext} className="bg-green-600 hover:bg-green-700">
            {currentIndex < deck.length - 1 ? "Next" : "Finish"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
