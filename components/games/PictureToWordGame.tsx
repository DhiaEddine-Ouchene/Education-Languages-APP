"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, ArrowRight, Lightbulb, Image as ImageIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type GameItem, shuffle } from "./types";
import { GameProgressBar } from "./GameProgressBar";

interface PictureToWordProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function PictureToWordGame({ items, settings, onComplete }: PictureToWordProps) {
  const deck = settings?.shuffle ? shuffle(items) : items;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentItem = deck[currentIndex];

  useEffect(() => {
    if (!currentItem) return;

    // Use generated distractors when available, fallback to sibling items
    let allOptions: string[];
    if (currentItem.distractors && currentItem.distractors.length >= 2) {
      allOptions = shuffle([currentItem.word, ...currentItem.distractors]);
    } else {
      const decoys = deck
        .filter((_, i) => i !== currentIndex)
        .map(item => item.word);
      const shuffledDecoys = shuffle(decoys).slice(0, 3);
      while (shuffledDecoys.length < 3) shuffledDecoys.push("???");
      allOptions = shuffle([currentItem.word, ...shuffledDecoys]);
    }

    setOptions(allOptions);
    setSelectedWord(null);
    setIsCorrect(null);
  }, [currentIndex, deck, currentItem]);

  const selectWord = (word: string) => {
    if (isCorrect !== null) return;
    setSelectedWord(word);
  };

  const checkAnswer = () => {
    if (!selectedWord || isCorrect !== null) return;
    const correct = selectedWord === currentItem.word;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onComplete(score, deck.length);
    }
  };

  if (!currentItem) return null;

  const hasImageTerm = !!(currentItem as any).imageSearchTerm;
  const imagePlaceholder = (currentItem as any).imageSearchTerm || currentItem.word;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <GameProgressBar current={currentIndex} total={deck.length} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image / Visual Area */}
        <div className="bg-white border border-border/60 rounded-xl overflow-hidden shadow-sm">
          <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-8">
            {hasImageTerm ? (
              <div className="text-center">
                <Search className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                <p className="text-lg font-semibold text-txt">"{imagePlaceholder}"</p>
                <p className="text-xs text-txt-secondary mt-2">(Image search term — actual image coming soon)</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-16 h-16 text-txt-secondary/30 mx-auto mb-4" />
                <p className="text-xl font-bold text-txt-dark italic">?</p>
              </div>
            )}
          </div>
          <div className="p-3 bg-muted/30 border-t border-border/40">
            <p className="text-xs text-txt-secondary text-center font-medium">
              {hasImageTerm
                ? "Look at the image concept above. Which word matches?"
                : "Match the concept with the correct word."}
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 justify-center">
          {options.map((opt) => {
            const isSelected = selectedWord === opt;
            const showCorrect = isCorrect !== null && opt === currentItem.word;
            const showWrong = isCorrect === false && isSelected;

            return (
              <button
                key={opt}
                disabled={isCorrect !== null}
                onClick={() => selectWord(opt)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                  isSelected && isCorrect === null
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02]",
                  showCorrect ? "border-green-500 bg-green-50" : "",
                  showWrong ? "border-red-500 bg-red-50 animate-[shake_0.4s_ease-in-out]" : "",
                  isCorrect !== null && !isSelected && !showCorrect ? "opacity-40" : ""
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-lg font-semibold",
                    showCorrect ? "text-green-800" : showWrong ? "text-red-800" : isSelected ? "text-primary" : "text-txt"
                  )}>
                    {opt}
                  </span>
                  {showCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
                  {showWrong && <span className="text-red-500 text-sm font-bold">✗</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-4">
        {isCorrect === null ? (
          <Button size="lg" disabled={!selectedWord} onClick={checkAnswer}>
            <CheckCircle className="w-5 h-5 mr-2" /> Check
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
