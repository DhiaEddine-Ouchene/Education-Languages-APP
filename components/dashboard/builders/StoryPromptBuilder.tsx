"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import type { BuilderProps } from "./index";

export function StoryPromptBuilder({ onChange, initial, onValidation, wordBank }: BuilderProps) {
  const [prompt, setPrompt] = useState((initial?.prompt as string) || "");
  const [template, setTemplate] = useState((initial?.template as string) || "");
  const [storyWordBank, setStoryWordBank] = useState<string[]>(() => (initial?.wordBank ? initial.wordBank as string[] : []));
  const [newWord, setNewWord] = useState("");

  useEffect(() => {
    onValidation?.(prompt.trim().length >= 10);
    onChange({ prompt, template, wordBank: storyWordBank });
  }, [prompt, template, storyWordBank, onChange, onValidation]);

  const addWord = () => {
    const t = newWord.trim();
    if (t && !storyWordBank.includes(t)) { setStoryWordBank((prev) => [...prev, t]); setNewWord(""); }
  };

  const addFromWordBank = (word: string) => {
    if (!storyWordBank.includes(word)) {
      setStoryWordBank((prev) => [...prev, word]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <label className="text-xs font-medium text-txt-secondary mb-1.5 block">Story Prompt</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write a story about your last vacation..."
          className="w-full min-h-[120px] rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" rows={4} />
        <p className="text-[10px] text-txt-secondary mt-1">{prompt.length} chars {prompt.length < 10 && "(min 10)"}</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <label className="text-xs font-medium text-txt-secondary mb-1.5 block">Required Words</label>
        {storyWordBank.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {storyWordBank.map((word) => (
              <span key={word} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20">
                {word}
                <button onClick={() => setStoryWordBank((prev) => prev.filter((w) => w !== word))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={newWord} onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWord(); } }}
            placeholder="Type a word..." className="text-sm flex-1" />
          <Button variant="outline" size="sm" onClick={addWord} disabled={!newWord.trim()}><Plus className="w-4 h-4" /></Button>
        </div>
        {/* Quick add from word bank */}
        {wordBank && wordBank.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <p className="text-[10px] text-txt-secondary mb-1.5">Add from word bank:</p>
            <div className="flex flex-wrap gap-1">
              {wordBank.slice(0, 12).map((chip) => {
                const added = storyWordBank.includes(chip.word);
                return (
                  <button
                    key={chip.id}
                    onClick={() => !added && addFromWordBank(chip.word)}
                    disabled={added}
                    className={`text-[10px] border px-2 py-0.5 rounded-md transition-colors ${added ? "bg-green-50 text-green-600 border-green-200" : "bg-card hover:bg-primary/10 text-txt-secondary border-border/40"}`}
                  >
                    {added ? "✓ " : "+ "}{chip.word}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <label className="text-xs font-medium text-txt-secondary mb-1.5 block">Structure Guide (optional)</label>
        <textarea value={template} onChange={(e) => setTemplate(e.target.value)}
          placeholder="Beginning → Middle → End"
          className="w-full min-h-[80px] rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" rows={3} />
      </div>
    </div>
  );
}
