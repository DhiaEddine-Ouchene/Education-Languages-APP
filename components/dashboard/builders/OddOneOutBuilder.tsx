"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";
import type { BuilderProps } from "./index";

type OddOneOutItem = {
  id: string;
  groupWords: string[];
  oddWord: string;
  category: string;
};

function createItem(overrides?: Partial<OddOneOutItem>): OddOneOutItem {
  return {
    id: `odd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    groupWords: ["", "", "", "", ""],
    oddWord: "",
    category: "",
    ...overrides,
  };
}

export function OddOneOutBuilder({ onChange, initial, onValidation, wordBank }: BuilderProps) {
  const [items, setItems] = useState<OddOneOutItem[]>(() => {
    const raw = initial?.oddOneOutItems || initial?.items || [];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item: any, i: number) => createItem({
        id: item.id || `odd-${i}`,
        groupWords: Array.isArray(item.groupWords) && item.groupWords.length >= 3
          ? item.groupWords
          : ["", "", "", "", ""],
        oddWord: item.oddWord || "",
        category: item.category || item.categoryName_target || "",
      }));
    }
    return [createItem()];
  });

  useEffect(() => {
    const valid = items.length >= 1 && items.every(
      (item) => item.groupWords.filter((w) => w.trim()).length >= 3 && item.oddWord.trim()
    );
    onValidation?.(valid);
    onChange({ oddOneOutItems: items });
  }, [items, onChange, onValidation]);

  const updateGroupWord = (itemId: string, idx: number, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const groupWords = [...item.groupWords];
        groupWords[idx] = value;
        return { ...item, groupWords };
      })
    );
  };

  const addGroupWord = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, groupWords: [...item.groupWords, ""] }
          : item
      )
    );
  };

  const removeGroupWord = (itemId: string, idx: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, groupWords: item.groupWords.filter((_, i) => i !== idx) }
          : item
      )
    );
  };

  const updateField = (id: string, field: "oddWord" | "category", value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, createItem()]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  const addFromWordBank = (word: string) => {
    const lastItem = items[items.length - 1];
    const emptyIdx = lastItem.groupWords.findIndex((w) => !w.trim());
    if (emptyIdx >= 0) {
      updateGroupWord(lastItem.id, emptyIdx, word);
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.id} className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-gradient-to-r from-primary/[0.02] to-transparent">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{idx + 1}</span>
              <span className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Word Group</span>
            </div>
            {items.length > 1 && (
              <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-50 text-txt-secondary hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="p-4 space-y-3">
            {/* Group Words */}
            <div>
              <label className="text-xs font-medium text-txt-secondary mb-1.5 block">
                Group Words — 4 share a category, 1 is the odd one
              </label>
              <div className="flex flex-wrap gap-2">
                {item.groupWords.map((w, wi) => (
                  <div key={wi} className="flex items-center gap-1">
                    <Input
                      value={w}
                      onChange={(e) => updateGroupWord(item.id, wi, e.target.value)}
                      placeholder={`Word ${wi + 1}`}
                      className={cn(
                        "text-sm h-9 w-28",
                        w.trim() && w === item.oddWord && "border-red-300 bg-red-50/50"
                      )}
                    />
                    {item.groupWords.length > 3 && (
                      <button
                        onClick={() => removeGroupWord(item.id, wi)}
                        className="w-4 h-4 rounded-full hover:bg-red-100 text-txt-secondary hover:text-red-500 flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => addGroupWord(item.id)} className="h-9 px-2 text-xs">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Odd Word & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-txt-secondary mb-1 block">Odd One Out</label>
                <Input
                  value={item.oddWord}
                  onChange={(e) => updateField(item.id, "oddWord", e.target.value)}
                  placeholder="e.g. carrot"
                  className="text-sm border-red-200 focus-visible:ring-red-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-txt-secondary mb-1 block">Category (optional)</label>
                <Input
                  value={item.category}
                  onChange={(e) => updateField(item.id, "category", e.target.value)}
                  placeholder="e.g. vegetable"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4" /> Add Word Group
      </Button>

      {wordBank && wordBank.length > 0 && (
        <div className="rounded-xl bg-primary/[0.03] border border-primary/10 p-3">
          <p className="text-xs font-medium text-txt-secondary mb-2">Add words from bank:</p>
          <div className="flex flex-wrap gap-1.5">
            {wordBank.slice(0, 10).map((chip) => (
              <button
                key={chip.id}
                onClick={() => addFromWordBank(chip.word)}
                className="text-xs bg-card hover:bg-primary/10 text-txt border border-border/40 hover:border-primary/30 px-2.5 py-1 rounded-lg transition-colors"
              >
                + {chip.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}