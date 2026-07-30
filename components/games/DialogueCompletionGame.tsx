"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type GameItem, shuffle } from "./types";
import { GameProgressBar } from "./GameProgressBar";

interface DialogueCompletionProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function DialogueCompletionGame({ items, settings, onComplete }: DialogueCompletionProps) {
  const deck = settings?.shuffle ? shuffle(items) : items;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState<Record<number, string>>({});  // lineIndex → answer
  const [blankOptions, setBlankOptions] = useState<Record<number, string[]>>({}); // lineIndex → options
  const [submitted, setSubmitted] = useState(false);
  const [blankResults, setBlankResults] = useState<Record<number, boolean>>({});

  const dialogueItem = deck[currentIndex];
  const scenario = (dialogueItem as any).scenario;
  const lines: { speaker: string; text: string; isBlank: boolean }[] = (dialogueItem as any).lines || [];
  const blanks: { lineIndex: number; correctAnswer: string; distractors: string[] }[] = (dialogueItem as any).blanks || [];
  const hasDialogue = scenario && lines.length > 0;

  useEffect(() => {
    setBlankAnswers({});
    setBlankOptions({});
    setSubmitted(false);
    setBlankResults({});

    if (blanks.length > 0) {
      const opts: Record<number, string[]> = {};
      blanks.forEach(b => {
        opts[b.lineIndex] = shuffle([b.correctAnswer, ...b.distractors]);
      });
      setBlankOptions(opts);
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectBlankAnswer = (lineIndex: number, answer: string) => {
    if (submitted) return;
    setBlankAnswers(prev => ({ ...prev, [lineIndex]: answer }));
  };

  const submitAnswers = () => {
    if (submitted) return;
    const results: Record<number, boolean> = {};
    let correctCount = 0;
    blanks.forEach(b => {
      const isCorrect = blankAnswers[b.lineIndex] === b.correctAnswer;
      results[b.lineIndex] = isCorrect;
      if (isCorrect) correctCount++;
    });
    setBlankResults(results);
    setSubmitted(true);
    if (correctCount === blanks.length) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onComplete(score, deck.length);
    }
  };

  if (!dialogueItem || !hasDialogue) {
    // Fallback: show basic word+translation
    return (
      <div className="max-w-md mx-auto space-y-6 p-4 text-center">
        <GameProgressBar current={currentIndex} total={deck.length} />
        <p className="text-xl font-bold">{dialogueItem?.word}</p>
        <p className="text-txt-secondary">{dialogueItem?.translation}</p>
        <Button onClick={handleNext}><ArrowRight className="w-4 h-4 mr-2" /> Next</Button>
      </div>
    );
  }

  const allBlanksFilled = blanks.every(b => blankAnswers[b.lineIndex]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <GameProgressBar current={currentIndex} total={deck.length} />

      {/* Scenario */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Scenario</span>
        <p className="text-lg font-semibold text-txt mt-1">{scenario}</p>
      </div>

      {/* Dialogue Lines */}
      <div className="space-y-4">
        {lines.map((line, i) => {
          const isLeft = i % 2 === 0;
          const blank = blanks.find(b => b.lineIndex === i);
          const userAnswer = blankAnswers[i];
          const isCorrect = blankResults[i];
          const options = blankOptions[i] || [];

          return (
            <div key={i} className={cn("flex", isLeft ? "justify-start" : "justify-end")}>
              <div className={cn("max-w-[80%] flex gap-3", isLeft ? "flex-row" : "flex-row-reverse")}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-5 h-5 text-primary/60" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-txt-secondary px-1">{line.speaker}</span>
                  <div className={cn(
                    "rounded-2xl p-4 border",
                    isLeft ? "bg-card border-border/60 rounded-bl-sm" : "bg-primary/5 border-primary/20 rounded-br-sm"
                  )}>
                    {line.isBlank && blank ? (
                      <div className="space-y-2">
                        <p className="text-sm text-txt-secondary">
                          {line.text.split("___").map((part: string, pi: number) => (
                            <React.Fragment key={pi}>
                              {pi > 0 && (
                                <span className={cn(
                                  "inline-block min-w-[80px] px-2 py-0.5 rounded-md font-bold text-center text-sm border-b-2",
                                  submitted
                                    ? isCorrect
                                      ? "bg-green-100 border-green-500 text-green-800"
                                      : "bg-red-100 border-red-500 text-red-800"
                                    : userAnswer
                                      ? "bg-primary/10 border-primary text-primary"
                                      : "bg-muted border-dashed border-border text-txt-secondary"
                                )}>
                                  {userAnswer || "___"}
                                </span>
                              )}
                              {part}
                            </React.Fragment>
                          ))}
                        </p>
                        {!submitted && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {options.map(opt => (
                              <button
                                key={opt}
                                onClick={() => selectBlankAnswer(i, opt)}
                                className={cn(
                                  "text-xs px-2.5 py-1 rounded-full border transition-colors",
                                  userAnswer === opt
                                    ? "bg-primary text-white border-primary"
                                    : "bg-card text-txt border-border/60 hover:border-primary/40"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                        {submitted && (
                          <div className="flex items-center gap-2 mt-1">
                            {isCorrect ? (
                              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Correct
                              </span>
                            ) : (
                              <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Correct: {blank.correctAnswer}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-txt">{line.text}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-4">
        {!submitted ? (
          <Button size="lg" onClick={submitAnswers} disabled={!allBlanksFilled}>
            <CheckCircle className="w-5 h-5 mr-2" /> Check Answers
          </Button>
        ) : (
          <Button size="lg" onClick={handleNext} className="bg-green-600 hover:bg-green-700">
            {currentIndex < deck.length - 1 ? "Next Dialogue" : "Finish"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
