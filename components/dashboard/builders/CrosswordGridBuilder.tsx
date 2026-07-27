"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ArrowRight, ArrowDown } from "lucide-react";
import type { BuilderProps } from "./index";

type CrosswordWord = {
  id: string;
  word: string;
  clue: string;
  direction: "across" | "down";
  row: number;
  col: number;
};

function createWord(overrides?: Partial<CrosswordWord>): CrosswordWord {
  return { id: `cw-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, word: "", clue: "", direction: "across", row: 0, col: 0, ...overrides };
}

export function CrosswordGridBuilder({ onChange, initial, onValidation, wordBank }: BuilderProps) {
  const [gridSize, setGridSize] = useState(initial?.gridSize as number || 10);
  const [words, setWords] = useState<CrosswordWord[]>(() => (initial?.words ? initial.words as CrosswordWord[] : []));

  useEffect(() => {
    const valid = words.length >= 2 && words.every((w) => w.word.trim() && w.clue.trim());
    onValidation?.(valid);
    onChange({ gridSize, words });
  }, [gridSize, words, onChange, onValidation]);

  const addFromWordBank = (word: string, translation: string) => {
    const cleanWord = word.toUpperCase();
    if (!words.some((w) => w.word.toUpperCase() === cleanWord)) {
      setWords((prev) => [...prev, createWord({ word: cleanWord, clue: translation })]);
    }
  };

  const updateWord = (id: string, field: keyof CrosswordWord, value: any) => {
    setWords((prev) => prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  };
  const removeWord = (id: string) => setWords((prev) => prev.filter((w) => w.id !== id));

  const gridCells = useMemo(() => {
    const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));
    words.forEach((w) => {
      w.word.toUpperCase().split("").forEach((letter, i) => {
        const r = w.direction === "down" ? w.row + i : w.row;
        const c = w.direction === "across" ? w.col + i : w.col;
        if (r < gridSize && c < gridSize) grid[r][c] = letter;
      });
    });
    return grid;
  }, [words, gridSize]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/40">
        <label className="text-xs font-medium text-txt-secondary">Grid:</label>
        {[6, 8, 10, 12].map((n) => (
          <button key={n} onClick={() => setGridSize(n)}
            className={cn("px-3 py-1 text-xs font-medium rounded-lg border transition-all",
              gridSize === n ? "bg-primary text-white border-primary" : "bg-card text-txt-secondary border-border/60 hover:border-primary/30")}>{n}×{n}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">Preview</h4>
          <div className="grid gap-px bg-border/60 rounded-lg overflow-hidden border border-border/60"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {gridCells.flat().map((cell, i) => (
              <div key={i} className={cn("aspect-square flex items-center justify-center text-[10px] font-bold", cell ? "bg-primary/10 text-primary" : "bg-card")}>{cell || ""}</div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">Words</h4>
          <div className="space-y-3">
            {words.map((w, i) => (
              <div key={w.id} className="rounded-xl border border-border/40 bg-white shadow-sm hover:shadow-md transition-all p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-txt-secondary">{i + 1}.</span>
                    <span className="font-bold text-sm text-txt">{w.word}</span>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", w.direction === "across" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600")}>
                      {w.direction === "across" ? <ArrowRight className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
                    </span>
                  </div>
                  <button onClick={() => removeWord(w.id)} className="p-1 rounded hover:bg-red-50 text-txt-secondary hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input value={w.clue} onChange={(e) => updateWord(w.id, "clue", e.target.value)} placeholder="Clue" className="col-span-2 text-xs h-8 rounded-lg border border-border bg-card px-2" />
                  <input type="number" min={0} max={gridSize - 1} value={w.row} onChange={(e) => updateWord(w.id, "row", parseInt(e.target.value) || 0)} className="text-xs h-8 rounded-lg border border-border bg-card px-2 w-full" />
                  <input type="number" min={0} max={gridSize - 1} value={w.col} onChange={(e) => updateWord(w.id, "col", parseInt(e.target.value) || 0)} className="text-xs h-8 rounded-lg border border-border bg-card px-2 w-full" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateWord(w.id, "direction", "across")}
                    className={cn("px-2 py-1 text-[10px] font-medium rounded-lg border transition-all", w.direction === "across" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-card text-txt-secondary border-border/60")}>→ Across</button>
                  <button onClick={() => updateWord(w.id, "direction", "down")}
                    className={cn("px-2 py-1 text-[10px] font-medium rounded-lg border transition-all", w.direction === "down" ? "bg-green-50 text-green-600 border-green-200" : "bg-card text-txt-secondary border-border/60")}>↓ Down</button>
                </div>
              </div>
            ))}
          </div>

          {wordBank && wordBank.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-primary/[0.03] border border-primary/10">
              <p className="text-[10px] text-txt-secondary mb-1.5">Add from word bank:</p>
              <div className="flex flex-wrap gap-1">
                {wordBank.slice(0, 10).map((chip) => {
                  const alreadyAdded = words.some((w) => w.word.toUpperCase() === chip.word.toUpperCase());
                  return (
                    <button
                      key={chip.id}
                      onClick={() => addFromWordBank(chip.word, chip.translation)}
                      disabled={alreadyAdded}
                      className={cn(
                        "text-[10px] border px-2 py-0.5 rounded-md transition-colors",
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
        </div>
      </div>
    </div>
  );
}
