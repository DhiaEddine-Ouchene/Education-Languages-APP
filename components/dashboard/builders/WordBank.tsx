"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Sparkles, Database, BookOpen, Loader2, X, Plus, Save } from "lucide-react";

export type ChipData = { 
  id: string; 
  word: string; 
  translation: string;
  synonym?: string;
  antonym?: string;
  exampleSentence?: string;
  definition?: string;
};

type ExistingSet = { id: string; name: string; items: { id: string; word: string; translation: string; exampleSentence?: string }[] };

type Props = {
  words: ChipData[];
  onWordsChange: (words: ChipData[]) => void;
  contentType?: string;
  existingSets?: ExistingSet[];
  language?: string;
  level?: string;
  onLanguageChange?: (lang: string) => void;
  onLevelChange?: (level: string) => void;
};

export function WordBank({
  words, onWordsChange, contentType = "words",
  existingSets, language = "English", level = "B1",
  onLanguageChange, onLevelChange,
}: Props) {
  const [mode, setMode] = useState<"ai" | "existing" | "manual">("ai");
  const [topic, setTopic] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [wordCount, setWordCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [manualWord, setManualWord] = useState("");
  const [manualTranslation, setManualTranslation] = useState("");

  const [savingSet, setSavingSet] = useState(false);
  const [setName, setSetName] = useState("");
  const [showSaveSet, setShowSaveSet] = useState(false);

  const generateWithAI = async () => {
    if (!topic.trim()) { toast("error", "Please enter a topic"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), language, targetLanguage, level, count: wordCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      
      const generated: ChipData[] = (data.items || []).map((item: any, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        word: item.word || "",
        translation: item.translation || "",
        synonym: item.synonym || "",
        antonym: item.antonym || "",
        exampleSentence: item.exampleSentence || "",
        definition: item.definition || "",
      }));
      onWordsChange(generated);
      toast("success", `Generated ${generated.length} items!`);
    } catch (err: any) {
      toast("error", err.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const loadExistingSet = (setId: string) => {
    setSelectedSetId(setId);
    const set = existingSets?.find((s) => s.id === setId);
    if (set) {
      onWordsChange(set.items.map((item, i) => ({
        id: `existing-${set.id}-${i}`,
        word: item.word,
        translation: item.translation,
      })));
    }
  };

  const addManualWord = () => {
    const w = manualWord.trim();
    const t = manualTranslation.trim();
    if (!w || !t) { toast("error", "Both word and translation are required"); return; }
    onWordsChange([...words, { id: `manual-${Date.now()}`, word: w, translation: t }]);
    setManualWord("");
    setManualTranslation("");
  };

  const removeWord = (id: string) => {
    onWordsChange(words.filter((w) => w.id !== id));
  };

  const handleSaveSet = async () => {
    if (!setName.trim()) { toast("error", "Please enter a name for the set"); return; }
    if (words.length < 2) { toast("error", "At least 2 words are required to save a set"); return; }
    
    setSavingSet(true);
    try {
      const vocabRes = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: setName.trim(),
          language,
          items: words.map((w) => ({
            word: w.word,
            translation: w.translation,
            exampleSentence: "",
          })),
        }),
      });
      if (!vocabRes.ok) throw new Error("Failed to create vocabulary set");
      
      toast("success", "Set saved successfully!");
      setShowSaveSet(false);
      setSetName("");
    } catch (err: any) {
      toast("error", err.message || "Something went wrong");
    } finally {
      setSavingSet(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/40 bg-background/30">
        <Database className="w-4 h-4 text-primary" />
        <span className="font-heading font-semibold text-xs text-txt uppercase tracking-wider">Word Bank</span>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full ml-auto">{words.length}</span>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-2 border-b border-border/30 bg-background/20">
        <button onClick={() => setMode("ai")} className={cn("flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all", mode === "ai" ? "bg-primary text-white shadow-sm" : "text-txt-secondary hover:text-txt")}>
          <Sparkles className="w-3 h-3 inline mr-1" />AI
        </button>
        <button onClick={() => setMode("existing")} className={cn("flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all", mode === "existing" ? "bg-primary text-white shadow-sm" : "text-txt-secondary hover:text-txt")}>
          <Database className="w-3 h-3 inline mr-1" />Sets
        </button>
        <button onClick={() => setMode("manual")} className={cn("flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all", mode === "manual" ? "bg-primary text-white shadow-sm" : "text-txt-secondary hover:text-txt")}>
          <Plus className="w-3 h-3 inline mr-1" />Manual
        </button>
      </div>

      {/* AI Generate Panel */}
      {mode === "ai" && (
        <div className="p-3 space-y-2 border-b border-border/30">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic..." className="text-xs h-8" />
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-txt-secondary mb-0.5 block">Word Lang</label>
              <Input value={language} onChange={(e) => onLanguageChange?.(e.target.value)} placeholder="English" className="text-xs h-8" />
            </div>
            <div>
              <label className="text-[10px] text-txt-secondary mb-0.5 block">Translation Lang</label>
              <Input value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} placeholder="French" className="text-xs h-8" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <Input type="number" min={3} max={50} value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} className="text-xs h-8" />
            {onLevelChange && (
              <select value={level} onChange={(e) => onLevelChange(e.target.value)} className="h-8 text-xs rounded-lg border border-border bg-card px-2 focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="A1">A1 - Beginner</option><option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option><option value="B2">B2 - Upper Int.</option>
                <option value="C1">C1 - Advanced</option><option value="C2">C2 - Mastery</option>
              </select>
            )}
          </div>
          <Button onClick={generateWithAI} disabled={generating || !topic.trim()} size="sm" className="w-full text-xs h-8 mt-1">
            {generating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {generating ? "Generating..." : "Generate Words"}
          </Button>
        </div>
      )}

      {/* Existing Sets Panel */}
      {mode === "existing" && existingSets && (
        <div className="p-3 border-b border-border/30">
          <select
            value={selectedSetId}
            onChange={(e) => loadExistingSet(e.target.value)}
            className="w-full h-8 text-xs rounded-lg border border-border bg-card px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select a vocabulary set...</option>
            {existingSets.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.items.length} words)</option>
            ))}
          </select>
        </div>
      )}

      {/* Manual Add Panel */}
      {mode === "manual" && (
        <div className="p-3 space-y-2 border-b border-border/30">
          <Input value={manualWord} onChange={(e) => setManualWord(e.target.value)} placeholder="Word..." className="text-xs h-8" />
          <Input value={manualTranslation} onChange={(e) => setManualTranslation(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManualWord(); } }}
            placeholder="Translation/Synonym..." className="text-xs h-8" />
          <Button onClick={addManualWord} disabled={!manualWord.trim() || !manualTranslation.trim()} size="sm" className="w-full text-xs h-8">
            <Plus className="w-3 h-3 mr-1" /> Add Word
          </Button>
        </div>
      )}

      {/* Save Set CTA */}
      {words.length >= 2 && !showSaveSet && mode !== "existing" && (
        <div className="px-3 pt-3">
          <button 
            onClick={() => setShowSaveSet(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors"
          >
            <Save className="w-3 h-3" /> Save this list as a reusable set
          </button>
        </div>
      )}

      {showSaveSet && (
        <div className="p-3 m-3 bg-primary/[0.03] border border-primary/20 rounded-xl space-y-2">
          <label className="text-[10px] font-medium text-txt-secondary block">Name your new vocabulary set:</label>
          <Input value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="e.g. Action Verbs" className="text-xs h-8" />
          <div className="flex gap-2">
            <Button onClick={handleSaveSet} disabled={savingSet || !setName.trim()} size="sm" className="w-full text-xs h-8">
              {savingSet ? "Saving..." : "Save Set"}
            </Button>
            <Button variant="ghost" onClick={() => setShowSaveSet(false)} size="sm" className="text-xs h-8 px-2">Cancel</Button>
          </div>
        </div>
      )}

      {/* Word List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ maxHeight: "400px" }}>
        {words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-txt-secondary">
            <BookOpen className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-medium">No words yet</p>
            <p className="text-[10px] mt-0.5">Generate, select a set, or add manually</p>
          </div>
        ) : (
          words.map((chip) => (
            <div key={chip.id} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/40 bg-card hover:border-primary/30 transition-colors">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-txt truncate block">{chip.word}</span>
                <span className="text-[10px] text-txt-secondary truncate block">{chip.translation}</span>
                {(chip.synonym || chip.antonym || chip.exampleSentence) && (
                  <div className="flex gap-1 mt-1">
                    {chip.synonym && <span className="text-[8px] px-1 py-0.5 rounded bg-green-50 text-green-600 border border-green-200" title="Synonym">S</span>}
                    {chip.antonym && <span className="text-[8px] px-1 py-0.5 rounded bg-red-50 text-red-600 border border-red-200" title="Antonym">A</span>}
                    {chip.exampleSentence && <span className="text-[8px] px-1 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200" title="Example Sentence">Ex</span>}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeWord(chip.id)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-txt-secondary hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
