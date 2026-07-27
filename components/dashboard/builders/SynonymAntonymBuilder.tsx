"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { BuilderProps } from "./index";

type SynonymItem = {
  id: string;
  word: string;
  synonym: string;
  antonym: string;
};

function createItem(overrides?: Partial<SynonymItem>): SynonymItem {
  return {
    id: `syn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    word: "", synonym: "", antonym: "",
    ...overrides,
  };
}

export function SynonymAntonymBuilder({ onChange, initial, onValidation, wordBank }: BuilderProps) {
  const [items, setItems] = useState<SynonymItem[]>(() => {
    if (initial?.synonymItems) return (initial.synonymItems as any[]).map((p, i) => createItem({ ...p, id: p.id || `syn-${i}` }));
    // Fallback if converting from a normal flashcard pair
    if (initial?.pairs) return (initial.pairs as any[]).map((p, i) => createItem({ id: `syn-${i}`, word: p.word || "", synonym: p.translation || "", antonym: p.exampleSentence || "" }));
    return [];
  });

  useEffect(() => {
    // Both synonym and antonym are required for this game to work fully.
    const valid = items.length >= 2 && items.every((i) => i.word.trim() && i.synonym.trim() && i.antonym.trim());
    onValidation?.(valid);
    onChange({ synonymItems: items });
  }, [items, onChange, onValidation]);

  const updateItem = (id: string, field: keyof SynonymItem, value: string) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addItem = () => setItems((prev) => [...prev, createItem()]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id));

  const addFromWordBank = (chip: any) => {
    setItems((prev) => [...prev, createItem({ 
      word: chip.word, 
      synonym: chip.synonym || chip.translation || "",
      antonym: chip.antonym || ""
    })]);
  };

  const addAllFromWordBank = () => {
    if (!wordBank || wordBank.length === 0) return;
    const newItems = wordBank
      .filter((chip) => !items.some((p) => p.word === chip.word))
      .map((chip) => createItem({ 
        word: chip.word, 
        synonym: chip.synonym || chip.translation || "",
        antonym: chip.antonym || ""
      }));
    setItems((prev) => [...prev, ...newItems]);
  };

  return (
    <div className="space-y-4">
      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all p-4 relative group">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Word Set</span>
                
                <button onClick={() => removeItem(item.id)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-md hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-txt-secondary transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-txt-secondary mb-1 block uppercase font-semibold">Target Word</label>
                  <Input
                    value={item.word}
                    onChange={(e) => updateItem(item.id, "word", e.target.value)}
                    placeholder="e.g. Happy"
                    className="text-sm font-heading font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-green-600 mb-1 block uppercase font-semibold">Synonym (Same meaning)</label>
                  <Input
                    value={item.synonym}
                    onChange={(e) => updateItem(item.id, "synonym", e.target.value)}
                    placeholder="e.g. Joyful"
                    className="text-sm border-green-200 focus-visible:ring-green-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-red-600 mb-1 block uppercase font-semibold">Antonym (Opposite)</label>
                  <Input
                    value={item.antonym}
                    onChange={(e) => updateItem(item.id, "antonym", e.target.value)}
                    placeholder="e.g. Sad"
                    className="text-sm border-red-200 focus-visible:ring-red-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <Button variant="outline" size="sm" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4" /> Add Word Set
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
              const alreadyAdded = items.some((p) => p.word === chip.word);
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

      {items.length > 0 && items.length < 2 && (
        <p className="text-xs text-amber-600 text-center">Add at least 2 items to continue</p>
      )}
      {items.length > 0 && items.some(i => !i.word.trim() || !i.synonym.trim() || !i.antonym.trim()) && (
        <p className="text-xs text-amber-600 text-center">Please fill out all Word, Synonym, and Antonym fields.</p>
      )}
    </div>
  );
}
