"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
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

export function FlashcardPairBuilder({ onChange, initial, onValidation, gameMeta, wordBank, generating }: BuilderProps) {
  const [pairs, setPairs] = useState<Pair[]>(() => {
    const rawPairs = initial?.pairs || initial?.items || [];
    return (rawPairs as any[]).map((p, i) => {
      const word = p.word || p.word_target || (Array.isArray(p.groupWords) ? p.groupWords.join(", ") : "") || p.baseWord_target || p.word1 || "";
      const translation = p.translation || p.word_native || p.oddWord || p.word2 || (Array.isArray(p.correctPartners) ? p.correctPartners.join(", ") : "") || "";
      const exampleSentence = p.exampleSentence || p.exampleSentence_target || p.phonemeContrast || (p.imageSearchTerm ? `Image search: ${p.imageSearchTerm}` : "") || "";

      return createPair({
        id: p.id || `pair-${i}`,
        word,
        translation,
        exampleSentence,
        audioUrl: p.audioUrl || "",
        imageUrl: p.imageUrl || "",
      });
    });
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
  const removeAll = () => setPairs([]);

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

  const [showWordBank, setShowWordBank] = useState(false);
  const allWordsAdded = wordBank && wordBank.length > 0 && wordBank.every((chip) => pairs.some((p) => p.word === chip.word));

  // Check if a word comes from the word bank (auto-populated)
  const isFromWordBank = (word: string) => wordBank?.some((chip) => chip.word === word) ?? false;

  return (
    <div className="space-y-4 relative">
      {/* Loading overlay during AI generation */}
      {generating && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <p className="text-sm font-medium text-txt-secondary">Generating game content...</p>
          <p className="text-xs text-txt-secondary mt-1">Fields will be auto-populated</p>
        </div>
      )}

      {/* Items grid */}
      {pairs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pairs.map((pair) => {
            const fromBank = !generating && isFromWordBank(pair.word);
            return (
            <div key={pair.id} className={cn(
              "relative rounded-xl border shadow-sm transition-all p-4 group",
              fromBank
                ? "bg-green-50/50 border-green-300"
                : "bg-white border-border/50 hover:shadow-md"
            )}>
              <button onClick={() => removePair(pair.id)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-border/60 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
              {fromBank && (
                <span className="absolute -top-2 -left-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-semibold shadow-sm">
                  ✓ Added
                </span>
              )}

              {gameMeta.type === "PICTURE_TO_WORD" && (
                <ImageUpload value={pair.imageUrl} onChange={(url) => updatePair(pair.id, "imageUrl", url)} label="picture" />
              )}

              <Input
                value={pair.word}
                onChange={(e) => updatePair(pair.id, "word", e.target.value)}
                placeholder={gameMeta.type === "PICTURE_TO_WORD" ? "Answer word" : "Word"}
                className={cn("text-sm font-heading font-semibold mb-1 h-8", fromBank && "border-green-300 bg-green-50/50")}
              />
              <Input
                value={pair.translation}
                onChange={(e) => updatePair(pair.id, "translation", e.target.value)}
                placeholder="Translation"
                className={cn("text-sm text-primary mb-1 h-8", fromBank && "border-green-300 bg-green-50/50")}
              />
              <Input value={pair.exampleSentence} onChange={(e) => updatePair(pair.id, "exampleSentence", e.target.value)}
                placeholder="Example (optional)" className={cn("text-xs h-7 mt-1", fromBank && "border-green-200 bg-green-50/50")} />
            </div>
            );
          })}
        </div>
      )}

      {/* Add / Remove buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addPair} className="flex-1">
          <Plus className="w-4 h-4" /> Add {itemLabel}
        </Button>
        {pairs.length > 0 && (
          <Button variant="ghost" size="sm" onClick={removeAll} className="text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Remove all
          </Button>
        )}
      </div>

      {/* Quick add from word bank (collapsible - hidden when all words are already in the builder) */}
      {wordBank && wordBank.length > 0 && !allWordsAdded && (
        <div className="rounded-xl bg-primary/[0.03] border border-primary/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setShowWordBank(!showWordBank)} className="flex items-center gap-1 text-xs font-medium text-txt-secondary hover:text-txt transition-colors">
              {showWordBank ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Word bank ({wordBank.length} words)
            </button>
            {!showWordBank && (
              <button onClick={addAllFromWordBank} className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors">
                + Add all
              </button>
            )}
          </div>
          {showWordBank && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-txt-secondary">Quick add:</p>
                <button onClick={addAllFromWordBank} className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors">
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
            </>
          )}
        </div>
      )}
      {wordBank && wordBank.length > 0 && allWordsAdded && pairs.length > 0 && (
        <div className="text-[11px] text-green-600 text-center bg-green-50 rounded-xl border border-green-200 p-2">
          ✓ All {wordBank.length} words from word bank are in the builder
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
