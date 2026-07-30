"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type GameItem, shuffle } from "./types";
import { GameProgressBar } from "./GameProgressBar";

interface VerbConjugationProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function VerbConjugationGame({ items, settings, onComplete }: VerbConjugationProps) {
  const deck = useMemo(() => (settings?.shuffle ? shuffle(items) : items), [items, settings?.shuffle]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const item = deck[idx];
  const verb = (item as any).verb || item.word;
  const tense = (item as any).tense || "Present";
  const forms: { pronoun: string; form: string }[] = (item as any).forms || [];
  const hasGenerated = forms.length > 0;

  const allPronouns = ["I", "You", "He/She", "We", "They"];

  const handleChange = (pronoun: string, value: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [pronoun]: value }));
  };

  const submitAnswers = () => {
    if (submitted) return;
    const res: Record<string, boolean> = {};
    let correctCount = 0;
    forms.forEach(f => {
      const isCorrect = (answers[f.pronoun] || "").toLowerCase().trim() === f.form.toLowerCase().trim();
      res[f.pronoun] = isCorrect;
      if (isCorrect) correctCount++;
    });
    setResults(res);
    setSubmitted(true);
    if (correctCount === forms.length) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) onComplete(score, deck.length);
    else { setIdx(i => i + 1); setAnswers({}); setSubmitted(false); setResults({}); }
  };

  if (!item) return null;

  if (!hasGenerated) {
    return (
      <div className="max-w-md mx-auto space-y-6 p-4 text-center">
        <GameProgressBar current={idx} total={deck.length} />
        <p className="font-heading font-semibold text-lg">{verb}</p>
        <p className="text-txt-secondary">{tense}</p>
        <Button onClick={handleNext}><ArrowRight className="w-4 h-4 mr-2" /> Next</Button>
      </div>
    );
  }

  const allFilled = forms.every(f => (answers[f.pronoun] || "").trim().length > 0);

  return (
    <div className="max-w-lg mx-auto space-y-6 p-4">
      <GameProgressBar current={idx} total={deck.length} />

      <div className="text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Verb Conjugation</span>
        <h2 className="text-2xl font-bold text-txt mt-1">{verb}</h2>
        <p className="text-sm text-txt-secondary">Tense: {tense}</p>
      </div>

      {/* Conjugation Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="grid grid-cols-2 gap-px bg-border/40">
          <div className="bg-primary/[0.03] p-3 text-xs font-semibold text-txt-secondary uppercase tracking-wider text-center">Pronoun</div>
          <div className="bg-primary/[0.03] p-3 text-xs font-semibold text-txt-secondary uppercase tracking-wider text-center">Form</div>
          {forms.map(f => {
            const isCorrect = results[f.pronoun];
            return (
              <React.Fragment key={f.pronoun}>
                <div className={cn(
                  "p-3 text-sm font-medium bg-card flex items-center justify-center border-t border-border/30",
                  submitted && (isCorrect ? "text-green-600" : "text-red-600")
                )}>
                  {f.pronoun}
                </div>
                <div className="p-2 bg-card border-t border-border/30">
                  {submitted ? (
                    <div className={cn(
                      "text-sm h-10 flex items-center justify-center rounded-lg border px-3",
                      isCorrect ? "bg-green-50 border-green-300 text-green-800" : "bg-red-50 border-red-300 text-red-800"
                    )}>
                      {isCorrect ? f.form : (
                        <span>{answers[f.pronoun] || "—"} <span className="opacity-50">→</span> <span className="font-bold">{f.form}</span></span>
                      )}
                    </div>
                  ) : (
                    <Input
                      value={answers[f.pronoun] || ""}
                      onChange={(e) => handleChange(f.pronoun, e.target.value)}
                      placeholder={f.pronoun === "You" ? "are" : `conjugate ${verb}`}
                      className="text-sm h-10 text-center"
                    />
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-4">
        {!submitted ? (
          <Button size="lg" onClick={submitAnswers} disabled={!allFilled}>
            <CheckCircle className="w-5 h-5 mr-2" /> Check
          </Button>
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
