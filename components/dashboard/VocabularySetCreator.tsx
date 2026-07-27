"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  BookOpen,
  FileText,
} from "lucide-react";

export type VocabWord = {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string;
};

type Props = {
  words: VocabWord[];
  onChange: (words: VocabWord[]) => void;
  language?: string;
  level?: string;
  onLanguageChange?: (lang: string) => void;
  onLevelChange?: (level: string) => void;
  contentType?: "words" | "phrases" | "sentences" | "grammar";
};

// Labels for each content type
const CONTENT_TYPE_UI: Record<string, { label: string; singular: string; placeholder: string; aiPlaceholder: string; countLabel: string }> = {
  words: { label: "Vocabulary words", singular: "Word", placeholder: "Word", aiPlaceholder: "e.g. Fruits, Daily routines, Travel vocabulary...", countLabel: "# of words" },
  phrases: { label: "Phrases & expressions", singular: "Phrase", placeholder: "Phrase (e.g. 'How are you?')", aiPlaceholder: "e.g. Greetings, Restaurant ordering, Phone calls...", countLabel: "# of phrases" },
  sentences: { label: "Example sentences", singular: "Sentence", placeholder: "Full sentence", aiPlaceholder: "e.g. Past tense examples, Conditional sentences...", countLabel: "# of sentences" },
  grammar: { label: "Grammar items", singular: "Item", placeholder: "Verb form / pattern", aiPlaceholder: "e.g. Present perfect, Passive voice, Reported speech...", countLabel: "# of items" },
};

export function VocabularySetCreator({
  words,
  onChange,
  language = "English",
  level = "B1",
  onLanguageChange,
  onLevelChange,
  contentType = "words",
}: Props) {
  const [topic, setTopic] = useState("");
  const [wordCount, setWordCount] = useState(10);
  const ui = CONTENT_TYPE_UI[contentType] || CONTENT_TYPE_UI.words;
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ word: "", translation: "", exampleSentence: "" });
  const [newWord, setNewWord] = useState({ word: "", translation: "", exampleSentence: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  const generateWithAI = async () => {
    if (!topic.trim()) {
      toast("error", "Please enter a topic for the vocabulary set");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          language,
          level,
          count: wordCount,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      const data = await res.json();
      const generated: VocabWord[] = (data.items || []).map((item: any, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        word: item.word,
        translation: item.translation,
        exampleSentence: item.exampleSentence || "",
      }));
      onChange(generated);
      toast("success", `Generated ${generated.length} words!`);
    } catch (err: any) {
      toast("error", err.message || "Failed to generate vocabulary");
    } finally {
      setGenerating(false);
    }
  };

  const startEdit = (w: VocabWord) => {
    setEditingId(w.id);
    setEditForm({ word: w.word, translation: w.translation, exampleSentence: w.exampleSentence || "" });
  };

  const saveEdit = () => {
    onChange(
      words.map((w) =>
        w.id === editingId
          ? { ...w, word: editForm.word, translation: editForm.translation, exampleSentence: editForm.exampleSentence }
          : w
      )
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const deleteWord = (id: string) => {
    onChange(words.filter((w) => w.id !== id));
  };

  const addWord = () => {
    if (!newWord.word.trim() || !newWord.translation.trim()) {
      toast("error", "Word and translation are required");
      return;
    }
    const w: VocabWord = {
      id: `manual-${Date.now()}`,
      word: newWord.word.trim(),
      translation: newWord.translation.trim(),
      exampleSentence: newWord.exampleSentence.trim(),
    };
    onChange([...words, w]);
    setNewWord({ word: "", translation: "", exampleSentence: "" });
    setShowAddForm(false);
  };

  const hasWords = words.length > 0;

  return (
    <div className="space-y-5">
      {/* ── AI Generation Section ── */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-semibold text-txt">Generate with AI</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-txt-secondary mb-1 block">Topic / Description</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={ui.aiPlaceholder}
              className="bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-txt-secondary mb-1 block">Language</label>
            <Input
              value={language}
              onChange={(e) => onLanguageChange?.(e.target.value)}
              placeholder="e.g. English"
              className="bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-txt-secondary mb-1 block">{ui.countLabel}</label>
            <Input
              type="number"
              min={3}
              max={50}
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={generateWithAI}
            disabled={generating || !topic.trim()}
            size="sm"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "Generating..." : "Generate vocabulary"}
          </Button>
          {onLevelChange && (
            <select
              value={level}
              onChange={(e) => onLevelChange(e.target.value)}
              className="h-9 text-sm rounded-lg border border-border bg-white px-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper Int.</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Mastery</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Word List ── */}
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-txt-secondary" />
            <span className="font-heading font-semibold text-sm text-txt">
              {ui.label}
            </span>
            {hasWords && (
              <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                {words.length} {contentType === "words" ? "words" : contentType === "phrases" ? "phrases" : contentType === "sentences" ? "sentences" : "items"}
              </span>
            )}
          </div>
          {!showAddForm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4" /> Add {ui.singular.toLowerCase()}
            </Button>
          )}
        </div>

        {/* Inline add form */}
        {showAddForm && (
          <div className="p-4 border-b border-border/40 bg-background/50 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                value={newWord.word}
                onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                placeholder={ui.singular}
              />
              <Input
                value={newWord.translation}
                onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
                placeholder="Translation"
              />
              <Input
                value={newWord.exampleSentence}
                onChange={(e) => setNewWord({ ...newWord, exampleSentence: e.target.value })}
                placeholder="Example (optional)"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addWord}>
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowAddForm(false); setNewWord({ word: "", translation: "", exampleSentence: "" }); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Words table */}
        {hasWords ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-background/30">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-txt-secondary uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-txt-secondary uppercase tracking-wider">{ui.singular}</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Translation</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-txt-secondary uppercase tracking-wider hidden sm:table-cell">Example</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-txt-secondary uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {words.map((w, i) => (
                  <tr
                    key={w.id}
                    className={cn(
                      "border-b border-border/20 transition-colors hover:bg-background/50",
                      editingId === w.id && "bg-primary/[0.03]"
                    )}
                  >
                    {editingId === w.id ? (
                      <>
                        <td className="px-4 py-2 text-xs text-txt-secondary">{i + 1}</td>
                        <td className="px-4 py-2">
                          <Input
                            value={editForm.word}
                            onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                            className="h-8 text-sm"
                            placeholder={ui.singular}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={editForm.translation}
                            onChange={(e) => setEditForm({ ...editForm, translation: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 hidden sm:table-cell">
                          <Input
                            value={editForm.exampleSentence}
                            onChange={(e) => setEditForm({ ...editForm, exampleSentence: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="Optional"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 text-xs text-txt-secondary">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-txt">{w.word}</td>
                        <td className="px-4 py-2.5 text-txt-secondary">{w.translation}</td>
                        <td className="px-4 py-2.5 text-xs text-txt-secondary hidden sm:table-cell truncate max-w-[200px]">
                          {w.exampleSentence || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-0.5">
                            <button
                              onClick={() => startEdit(w)}
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-txt-secondary hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteWord(w.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-txt-secondary hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-10 h-10 text-txt-secondary/40 mb-3" />
            <p className="text-sm text-txt-secondary font-medium">No {ui.label.toLowerCase()} yet</p>
            <p className="text-xs text-txt-secondary/60 mt-1">
              Use AI to generate {contentType === "words" ? "words" : contentType === "phrases" ? "phrases" : contentType === "sentences" ? "sentences" : "items"} from a topic, or add them manually
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
