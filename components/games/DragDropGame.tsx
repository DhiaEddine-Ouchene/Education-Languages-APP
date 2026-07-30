"use client";
import { useMemo, useState } from "react";
import { GameProgressBar } from "./GameProgressBar";
import { type GameItem, type GameProps, shuffle } from "./types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

export function DragDropGame({ items, settings, onComplete }: GameProps) {
  const deck = useMemo(() => (settings.shuffle ? shuffle(items) : items), [items, settings.shuffle]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);

  const item = deck[idx] as any;
  const dragItems: string[] = item.dragItems || [];
  const dragCategories: string[] = item.dragCategories || [];
  const correctMapping: Record<string, string> = item.correctMapping || {};
  const hasGenerated = dragItems.length > 0 && dragCategories.length > 0;

  // Fallback: use the word + shuffle letters (original behavior)
  if (!hasGenerated) {
    return <DragDropFallback item={item} idx={idx} deck={deck} onComplete={onComplete} />;
  }

  const [placed, setPlaced] = useState<Record<string, string>>({}); // item → category
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const unplaced = dragItems.filter(d => !placed[d]);
  const remainingCategories = dragCategories.filter(c =>
    Object.values(placed).filter(v => v === c).length < dragItems.filter(d => correctMapping[d] === c).length
  );

  const dropItem = (itemName: string, category: string) => {
    if (submitted) return;
    setPlaced(prev => ({ ...prev, [itemName]: category }));
  };

  const removeItem = (itemName: string) => {
    if (submitted) return;
    setPlaced(prev => {
      const next = { ...prev };
      delete next[itemName];
      return next;
    });
  };

  const submit = () => {
    if (submitted) return;
    const res: Record<string, boolean> = {};
    let correctCount = 0;
    dragItems.forEach(d => {
      const isCorrect = placed[d] === correctMapping[d];
      res[d] = isCorrect;
      if (isCorrect) correctCount++;
    });
    setResults(res);
    setSubmitted(true);
    if (correctCount === dragItems.length) setCorrect(c => c + 1);
  };

  const next = () => {
    if (idx + 1 >= deck.length) return onComplete(correct, deck.length);
    setIdx(idx + 1); setPlaced({}); setResults({}); setSubmitted(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <GameProgressBar current={idx} total={deck.length} />

      <p className="text-center text-sm text-txt-secondary font-medium">
        Drag each word into its correct category
      </p>

      {/* Categories as drop zones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dragCategories.map(cat => {
          const itemsInCat = Object.entries(placed).filter(([_, c]) => c === cat).map(([item]) => item);
          return (
            <div
              key={cat}
              className={cn(
                "min-h-[120px] border-2 rounded-xl p-3 space-y-1.5",
                submitted ? "bg-gray-50 border-border" : "border-dashed border-border/60 bg-card/50"
              )}
            >
              <p className="text-xs font-bold text-txt-secondary uppercase tracking-wider mb-2">{cat}</p>
              {itemsInCat.map(itemName => (
                <div
                  key={itemName}
                  onClick={() => !submitted && removeItem(itemName)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors",
                    submitted
                      ? results[itemName]
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                      : "bg-primary text-white hover:bg-primary-dark"
                  )}
                >
                  {itemName}
                  {submitted && (results[itemName] ? " ✓" : ` ✗ (→ ${correctMapping[itemName]})`)}
                </div>
              ))}
              {itemsInCat.length === 0 && (
                <p className="text-xs text-txt-secondary/50 italic">Drop items here</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Draggable items */}
      {unplaced.length > 0 && !submitted && (
        <div className="flex flex-wrap gap-2 justify-center p-3 bg-card rounded-xl border border-border/40">
          {unplaced.map(itemName => (
            <div key={itemName} className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold text-txt px-3 py-1">{itemName}</span>
              <div className="flex gap-1">
                {dragCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => dropItem(itemName, cat)}
                    className={cn(
                      "text-xs px-2 py-1 rounded-lg border transition-colors",
                      placed[itemName] === cat
                        ? "bg-primary text-white border-primary"
                        : "bg-card text-txt-secondary border-border/60 hover:border-primary/40 hover:text-txt"
                    )}
                  >
                    → {cat}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center pt-4">
        {!submitted ? (
          <Button onClick={submit} disabled={Object.keys(placed).length < dragItems.length}>
            <CheckCircle className="w-4 h-4 mr-2" /> Check
          </Button>
        ) : (
          <Button onClick={next} className="bg-green-600 hover:bg-green-700">
            {idx < deck.length - 1 ? "Next" : "Finish"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Fallback: original tile-reordering game when no generated data
function DragDropFallback({ item, idx, deck, onComplete }: { item: any; idx: number; deck: any[]; onComplete: any }) {
  const [correct, setCorrect] = useState(0);
  const target = item.exampleSentence?.toLowerCase().includes(item.word.toLowerCase()) ? item.exampleSentence : item.word;
  const tiles: { id: number; text: string }[] = useMemo(() => {
    const parts = (target as string).includes(" ") ? (target as string).split(" ") : (target as string).split("");
    return shuffle(parts.map((p: string, i: number) => ({ id: i, text: p })));
  }, [target]);
  const [placed, setPlaced] = useState<{ id: number; text: string }[]>([]);
  const [result, setResult] = useState<"ok" | "bad" | null>(null);
  const remaining = tiles.filter((t: { id: number; text: string }) => !placed.some((p) => p.id === t.id));
  const joiner = target.includes(" ") ? " " : "";

  const check = () => {
    const ok = placed.map((p) => p.text).join(joiner).toLowerCase() === target.toLowerCase();
    setResult(ok ? "ok" : "bad");
    if (ok) setCorrect(c => c + 1);
  };

  const next = () => {
    if (idx + 1 >= deck.length) return onComplete(correct, deck.length);
    setPlaced([]); setResult(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <GameProgressBar current={idx} total={deck.length} />
      <p className="text-center text-sm text-txt-secondary">Assemble: <b>{item.translation}</b></p>
      <div className={cn("min-h-16 border-2 border-dashed rounded-card p-3 flex flex-wrap gap-1.5 justify-center items-center",
        result === "ok" ? "border-accent bg-accent-light" : result === "bad" ? "border-error bg-red-50" : "border-border bg-card"
      )}>
        {placed.length === 0 && <span className="text-xs text-txt-secondary">Tap tiles below to place them here</span>}
        {placed.map((p) => (
          <button key={p.id} onClick={() => !result && setPlaced(placed.filter((x) => x.id !== p.id))} className="bg-primary text-white rounded-btn px-2.5 py-1.5 text-sm font-medium">{p.text}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {remaining.map((t: { id: number; text: string }) => (
          <button key={t.id} onClick={() => !result && setPlaced([...placed, t])} className="bg-card border border-border rounded-btn px-2.5 py-1.5 text-sm font-medium hover:bg-primary-light">{t.text}</button>
        ))}
      </div>
      <div className="flex justify-center">
        {result == null ? (
          <Button onClick={check} disabled={remaining.length > 0}>Check</Button>
        ) : (
          <Button onClick={next}>{idx + 1 >= deck.length ? "Finish" : "Next"}</Button>
        )}
      </div>
    </div>
  );
}
