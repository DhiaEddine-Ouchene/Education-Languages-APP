"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { BuilderProps } from "./index";

type SentenceItem = {
  id: string;
  sentence: string;
  correctAnswer: string;
  options: string[];
};

function createItem(overrides?: Partial<SentenceItem>): SentenceItem {
  return {
    id: `sf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sentence: "",
    correctAnswer: "",
    options: ["", "", ""],
    ...overrides,
  };
}

// Determine labels based on game type
function getLabels(gameType: string) {
  switch (gameType) {
    case "DICTATION":
      return {
        sentenceLabel: "Sentence / Phrase to dictate",
        sentencePlaceholder: "e.g. The weather is beautiful today.",
        answerLabel: "Expected answer",
        answerPlaceholder: "The weather is beautiful today.",
        showOptions: false,
        itemLabel: "dictation item",
      };
    case "SENTENCE_BUILDER":
      return {
        sentenceLabel: "Full correct sentence",
        sentencePlaceholder: "e.g. I go to school every day.",
        answerLabel: "Correct sentence (same)",
        answerPlaceholder: "I go to school every day.",
        showOptions: false,
        itemLabel: "sentence",
      };
    case "LISTEN_FILL_WORD":
    case "SPEAK_FILL_WORD":
      return {
        sentenceLabel: "Sentence with blank (use ___ for the gap)",
        sentencePlaceholder: "e.g. I ___ to school every day.",
        answerLabel: "Correct word",
        answerPlaceholder: "e.g. go",
        showOptions: true,
        itemLabel: "item",
      };
    case "LISTEN_FILL_SENTENCE":
    case "SPEAK_FILL_SENTENCE":
      return {
        sentenceLabel: "Full sentence (audio prompt)",
        sentencePlaceholder: "e.g. I like to read books before bed.",
        answerLabel: "Expected response",
        answerPlaceholder: "I like to read books before bed.",
        showOptions: false,
        itemLabel: "item",
      };
    case "DRAG_DROP":
      return {
        sentenceLabel: "Sentence with blank (use ___ for the gap)",
        sentencePlaceholder: "e.g. The cat ___ sleeping on the sofa.",
        answerLabel: "Correct word/phrase",
        answerPlaceholder: "e.g. is",
        showOptions: true,
        itemLabel: "sentence",
      };
    case "SITUATION_DIALOGUE_FILL":
      return {
        sentenceLabel: "Dialogue line with blank (use ___ for the gap)",
        sentencePlaceholder: "e.g. A: How ___ are you? B: I'm 12.",
        answerLabel: "Correct answer",
        answerPlaceholder: "e.g. old",
        showOptions: true,
        itemLabel: "dialogue",
      };
    default:
      // FILL_GAP_WORD, FILL_BLANK, FILL_BLANK_GRAMMAR
      return {
        sentenceLabel: "Sentence with blank (use ___ for the gap)",
        sentencePlaceholder: "e.g. She ___ (play) tennis every Sunday.",
        answerLabel: "Correct answer",
        answerPlaceholder: "e.g. plays",
        showOptions: true,
        itemLabel: "item",
      };
  }
}

export function SentenceFillBuilder({ onChange, initial, onValidation, gameMeta, wordBank, onWordBankChange }: BuilderProps) {
  const labels = getLabels(gameMeta.type);

  const [items, setItems] = useState<SentenceItem[]>(() => {
    if (initial?.sentenceItems) return (initial.sentenceItems as any[]).map((s, i) => createItem({ ...s, id: s.id || `sf-${i}` }));
    if (initial?.items) return (initial.items as any[]).map((s, i) => createItem({
      id: `sf-${i}`,
      sentence: s.sentence || s.sentence_target || "",
      correctAnswer: s.correctAnswer || s.expectedResponse_target || "",
      options: s.options || ["", "", ""],
    }));
    return [];
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const valid = items.length >= 2 && items.every((item) => item.sentence.trim() && item.correctAnswer.trim());
    onValidation?.(valid);
    onChange({ sentenceItems: items });
  }, [items, onChange, onValidation]);

  const updateItem = (id: string, field: keyof SentenceItem, value: any) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const updateOption = (itemId: string, optIdx: number, value: string) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const options = [...item.options];
      options[optIdx] = value;
      return { ...item, options };
    }));
  };

  const addItem = () => {
    const newItem = createItem();
    setItems((prev) => [...prev, newItem]);
    setExpandedId(newItem.id);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  const addFromWordBank = (word: string, translation: string) => {
    // For sentence-fill, use the word as a basis
    const sentence = `The word "${word}" means ___ .`;
    setItems((prev) => [...prev, createItem({ sentence, correctAnswer: translation })]);
  };

  return (
    <div className="space-y-3">
      {/* Items list */}
      {items.map((item, idx) => {
        const isExpanded = expandedId === item.id;
        return (
          <div key={item.id} className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Item header - always visible */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/[0.02] to-transparent cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-txt truncate">
                  {item.sentence.trim() || <span className="text-txt-secondary italic">Empty {labels.itemLabel}...</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.correctAnswer.trim() && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                    ✓ {item.correctAnswer}
                  </span>
                )}
                {items.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                    className="p-1 rounded hover:bg-red-50 text-txt-secondary hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-txt-secondary" /> : <ChevronDown className="w-4 h-4 text-txt-secondary" />}
              </div>
            </div>

            {/* Expanded form */}
            {isExpanded && (
              <div className="p-4 space-y-3 border-t border-border/40">
                <div>
                  <label className="text-xs font-medium text-txt-secondary mb-1 block">{labels.sentenceLabel}</label>
                  <Input
                    value={item.sentence}
                    onChange={(e) => updateItem(item.id, "sentence", e.target.value)}
                    placeholder={labels.sentencePlaceholder}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-txt-secondary mb-1 block">{labels.answerLabel}</label>
                  <Input
                    value={item.correctAnswer}
                    onChange={(e) => updateItem(item.id, "correctAnswer", e.target.value)}
                    placeholder={labels.answerPlaceholder}
                    className="text-sm"
                  />
                </div>

                {labels.showOptions && (
                  <div>
                    <label className="text-xs font-medium text-txt-secondary mb-1 block">Distractor options (wrong answers)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {item.options.map((opt, oi) => (
                        <Input
                          key={oi}
                          value={opt}
                          onChange={(e) => updateOption(item.id, oi, e.target.value)}
                          placeholder={`Distractor ${oi + 1}`}
                          className="text-sm h-9"
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-txt-secondary mt-1">These will be shown alongside the correct answer as choices.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add button */}
      <Button variant="outline" size="sm" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4" /> Add {labels.itemLabel}
      </Button>

      {/* Add from word bank hint */}
      {wordBank && wordBank.length > 0 && (
        <div className="rounded-xl bg-primary/[0.03] border border-primary/10 p-3">
          <p className="text-xs font-medium text-txt-secondary mb-2">Quick add from word bank:</p>
          <div className="flex flex-wrap gap-1.5">
            {wordBank.slice(0, 10).map((chip) => (
              <button
                key={chip.id}
                onClick={() => addFromWordBank(chip.word, chip.translation)}
                className="text-xs bg-card hover:bg-primary/10 text-txt border border-border/40 hover:border-primary/30 px-2.5 py-1 rounded-lg transition-colors"
              >
                + {chip.word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation message */}
      {items.length > 0 && items.length < 2 && (
        <p className="text-xs text-amber-600 text-center">Add at least 2 items to continue</p>
      )}
      {items.length >= 2 && (
        <div className="text-xs text-txt-secondary text-center">
          {items.length} {items.length === 1 ? labels.itemLabel : `${labels.itemLabel}s`} ready
        </div>
      )}
    </div>
  );
}
