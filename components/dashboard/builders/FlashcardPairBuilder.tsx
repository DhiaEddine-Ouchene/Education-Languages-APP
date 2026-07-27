"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { BuilderProps } from "./index";

type Pair = {
  id: string;
  word: string;
  translation: string;
  exampleSentence: string;
  audioUrl: string;
  imageUrl: string;
};

function createPair(overrides?: Partial<Pair>): Pair {
  return {
    id: `pair-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    word: "", translation: "", exampleSentence: "", audioUrl: "", imageUrl: "",
    ...overrides,
  };
}

export function FlashcardPairBuilder({ onChange, initial, onValidation, gameMeta, wordBank }: BuilderProps) {
  const [pairs, setPairs] = useState<Pair[]>(() => {
    if (initial?.pairs) return (initial.pairs as any[]).map((p, i) => createPair({ ...p, id: p.id || `pair-${i}` }));
    if (initial?.items) return (initial.items as any[]).map((p, i) => createPair({ id: `pair-${i}`, word: p.word || "", translation: p.translation || "", exampleSentence: p.exampleSentence || "" }));
    return [];
  });

  useEffect(() => {
    const valid = pairs.length >= 2 && pairs.every((p) => p.word.trim() && p.translation.trim());
    onValidation?.(valid);
    onChange({ pairs });
  }, [pairs, onChange, onValidation]);

  const updatePair = (id: string, field: keyof Pair, value: string) => {
    setPairs((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addPair = () => setPairs((prev) => [...prev, createPair()]);
  const removePair = (id: string) => setPairs((prev) => prev.filter((p) => p.id !== id));

  const addFromWordBank = (chip: any) => {
    setPairs((prev) => [...prev, createPair({ 
      word: chip.word, 
      translation: chip.translation,
      exampleSentence: chip.exampleSentence || "" 
    })]);
  };

  const addAllFromWordBank = () => {
    if (!wordBank || wordBank.length === 0) return;
    const newPairs = wordBank
      .filter((chip) => !pairs.some((p) => p.word === chip.word))
      .map((chip) => createPair({ 
        word: chip.word, 
        translation: chip.translation,
        exampleSentence: chip.exampleSentence || "" 
      }));
    setPairs((prev) => [...prev, ...newPairs]);
  };

  const itemLabel = gameMeta.vocabContentType === "phrases" ? "phrase" : gameMeta.vocabContentType === "sentences" ? "sentence" : "pair";

  return (
    <div className="space-y-4">
      {/* Items grid */}
      {pairs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pairs.map((pair) => (
            <div key={pair.id} className="relative bg-white rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all p-4 group">
              <button onClick={() => removePair(pair.id)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-border/60 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>

              <Input
                value={pair.word}
                onChange={(e) => updatePair(pair.id, "word", e.target.value)}
                placeholder="Word"
                className="text-sm font-heading font-semibold mb-1 h-8"
              />
              <Input
                value={pair.translation}
                onChange={(e) => updatePair(pair.id, "translation", e.target.value)}
                placeholder="Translation"
                className="text-sm text-primary mb-1 h-8"
              />
              <Input value={pair.exampleSentence} onChange={(e) => updatePair(pair.id, "exampleSentence", e.target.value)}
                placeholder="Example (optional)" className="text-xs h-7 mt-1" />
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <Button variant="outline" size="sm" onClick={addPair} className="w-full">
        <Plus className="w-4 h-4" /> Add {itemLabel}
      </Button>

      {/* Quick add from word bank */}
      {wordBank && wordBank.length > 0 && (
        <div className="rounded-xl bg-primary/[0.03] border border-primary/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-txt-secondary">Quick add from word bank:</p>
            <button
              onClick={addAllFromWordBank}
              className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              + Add all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {wordBank.map((chip) => {
              const alreadyAdded = pairs.some((p) => p.word === chip.word);
              return (
                <button
                  key={chip.id}
                  onClick={() => !alreadyAdded && addFromWordBank(chip)}
                  disabled={alreadyAdded}
                  className={cn(
                    "text-xs border px-2.5 py-1 rounded-lg transition-colors",
                    alreadyAdded
                      ? "bg-green-50 text-green-600 border-green-200 cursor-default"
                      : "bg-card hover:bg-primary/10 text-txt border-border/40 hover:border-primary/30"
                  )}
                >
                  {alreadyAdded ? "✓ " : "+ "}{chip.word}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {pairs.length > 0 && pairs.length < 2 && (
        <p className="text-xs text-amber-600 text-center">Add at least 2 items to continue</p>
      )}
      {pairs.length >= 2 && (
        <div className="text-xs text-txt-secondary text-center">{pairs.length} {pairs.length === 1 ? itemLabel : `${itemLabel}s`} ready</div>
      )}
    </div>
  );
}
