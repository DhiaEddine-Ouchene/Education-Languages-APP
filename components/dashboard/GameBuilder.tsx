"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Eye,
  PlayCircle,
  Save,
  Settings,
  Sparkles,
  ChevronDown,
  BookOpen,
  Timer,
  Lightbulb,
  Shuffle,
  Volume2,
  CheckCircle2,
  Grid3X3,
} from "lucide-react";
import { GamePlayer } from "@/components/games/GamePlayer";
import type { GameItem, GameSettings } from "@/components/games/types";

const GAME_TYPES = [
  // Classic
  { key: "FLASHCARD", label: "Flashcard", emoji: "🃏", description: "Flip cards to learn words and translations" },
  { key: "FILL_BLANK", label: "Fill blank", emoji: "✏️", description: "Type the missing word in sentences" },
  { key: "DRAG_DROP", label: "Drag & drop", emoji: "🧩", description: "Match items by dragging them" },
  { key: "QUIZ", label: "Quiz", emoji: "❓", description: "Multiple-choice questions" },
  { key: "DICTATION", label: "Dictation", emoji: "🎧", description: "Listen and type what you hear" },
  { key: "MEMORY", label: "Memory", emoji: "🧠", description: "Find matching pairs" },
  { key: "SPEED_ROUND", label: "Speed round", emoji: "⚡", description: "Quick-fire timed answers" },
  { key: "STORY", label: "Story", emoji: "📖", description: "Build a story from prompts" },
  // Vocabulary
  { key: "SYNONYM_ANTONYM", label: "Synonym/Antonym", emoji: "🔤", description: "Match words with similar meanings" },
  { key: "FILL_GAP_WORD", label: "Fill gap (word)", emoji: "📝", description: "Complete sentences with vocabulary" },
  { key: "WORD_MEANING_MATCH", label: "Word meaning", emoji: "🔍", description: "Match words to definitions" },
  { key: "SITUATION_DIALOGUE_FILL", label: "Dialogue fill", emoji: "💬", description: "Complete conversations" },
  { key: "WORD_IN_CONTEXT", label: "Word in context", emoji: "📄", description: "Choose the right word for the context" },
  { key: "WORD_SCRAMBLE", label: "Word scramble", emoji: "🔀", description: "Unscramble letters to form words" },
  { key: "ODD_ONE_OUT", label: "Odd one out", emoji: "🎯", description: "Find the word that doesn't belong" },
  // Grammar
  { key: "SENTENCE_BUILDER", label: "Sentence builder", emoji: "🏗️", description: "Arrange words into correct sentences" },
  { key: "ERROR_SPOTTING", label: "Error spotting", emoji: "🔎", description: "Find grammar mistakes" },
  { key: "FILL_BLANK_GRAMMAR", label: "Fill blank (grammar)", emoji: "✍️", description: "Complete with correct grammar" },
  { key: "VERB_CONJUGATION", label: "Verb conjugation", emoji: "🔄", description: "Conjugate verbs in different tenses" },
  { key: "MULTIPLE_CHOICE_GRAMMAR", label: "MC grammar", emoji: "☑️", description: "Choose the grammatically correct option" },
  // Listening & Speaking
  { key: "LISTEN_FILL_WORD", label: "Listen fill word", emoji: "🎧", description: "Listen and fill in missing words" },
  { key: "LISTEN_FILL_SENTENCE", label: "Listen fill sentence", emoji: "🔊", description: "Listen and reconstruct sentences" },
  { key: "SPEAK_FILL_WORD", label: "Speak fill word", emoji: "🎙️", description: "Speak the missing word aloud" },
  { key: "SPEAK_FILL_SENTENCE", label: "Speak fill sentence", emoji: "🗣️", description: "Speak complete sentences" },
] as const;

type GameType = (typeof GAME_TYPES)[number]["key"];
type VocabSet = { id: string; name: string; items: { id: string; word: string; translation: string; audioUrl?: string | null; imageUrl?: string | null; exampleSentence?: string | null }[] };
type Props = {
  sets: VocabSet[];
  initial?: {
    id: string;
    title: string;
    type: string;
    vocabularySetId: string;
    settings: Record<string, unknown>;
    isPublished: boolean;
    isMarketplace: boolean;
    price: number;
  };
};

export function GameBuilder({ sets, initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"build" | "try">("build");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<GameType>((initial?.type as GameType) ?? "FLASHCARD");
  const [setId, setSetId] = useState(initial?.vocabularySetId ?? sets[0]?.id ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [isMarketplace, setIsMarketplace] = useState(initial?.isMarketplace ?? false);
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const s = (initial?.settings ?? {}) as Record<string, unknown>;
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: (s.difficulty as string) ?? "medium",
    timer: (s.timer as number) ?? 30,
    hints: (s.hints as boolean) ?? true,
    audioAutoplay: (s.audioAutoplay as boolean) ?? false,
    shuffle: (s.shuffle as boolean) ?? true,
  });
  const selectedSet = sets.find((x) => x.id === setId);
  const preview = selectedSet?.items[0];
  const previewItems = useMemo<GameItem[]>(() => (selectedSet?.items ?? []).map((item) => ({
    id: item.id,
    word: item.word,
    translation: item.translation,
    audioUrl: item.audioUrl ?? null,
    imageUrl: item.imageUrl ?? null,
    exampleSentence: item.exampleSentence ?? null,
  })), [selectedSet]);

  const currentGameType = GAME_TYPES.find((t) => t.key === type);

  const save = async () => {
    if (title.trim().length < 3) return setError("Title must be at least 3 characters");
    if (!setId) return setError("Select a vocabulary set");
    setError("");
    setSaving(true);
    try {
      const res = await fetch(initial ? `/api/games/${initial.id}` : "/api/games", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, vocabularySetId: setId, settings, isPublished, isMarketplace, price: Number(price) }),
      });
      if (!res.ok) { toast("error", "Failed to save game"); return; }
      toast("success", initial ? "Game updated" : "Game created");
      router.push("/dashboard/games");
      router.refresh();
    } finally { setSaving(false); }
  };

  if (sets.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-txt-secondary mb-4" />
          <h3 className="font-heading font-semibold text-lg mb-2">No vocabulary sets yet</h3>
          <p className="text-txt-secondary text-sm mb-4">You need a vocabulary set before creating a game.</p>
          <Link href="/dashboard/vocabulary">
            <Button>Create a vocabulary set</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ──────── Header Bar ──────── */}
      <Card className="border-none bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 min-w-[260px]">
              <Label className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Game title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fruit Vocabulary Quiz"
                className="text-lg font-heading font-semibold mt-1"
              />
              <FieldError message={error} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={mode === "build" ? "primary" : "outline"}
                size="sm"
                onClick={() => setMode("build")}
              >
                <Settings className="h-4 w-4" /> Builder
              </Button>
              <Button
                variant={mode === "try" ? "accent" : "outline"}
                size="sm"
                onClick={() => setMode("try")}
              >
                <PlayCircle className="h-4 w-4" /> Try
              </Button>
              <Button onClick={save} disabled={saving} size="sm">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : initial ? "Save" : "Create"}
              </Button>
              {initial && (
                <Link href={`/dashboard/games/${initial.id}/preview`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" /> Preview
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {mode === "try" ? (
        /* ──────── Try Mode ──────── */
        <div className="animate-fade-in">
          <GamePlayer
            gameId={initial?.id ?? "draft-preview"}
            title={title.trim() || "Untitled game preview"}
            type={type}
            items={previewItems}
            settings={settings}
            previewMode
          />
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => setMode("build")}>
              ← Back to builder
            </Button>
          </div>
        </div>
      ) : (
        /* ──────── Builder Mode ──────── */
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5">

          {/* ── Left: Vocabulary Set ── */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-5 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
                  Vocabulary set
                </Label>
                <Select value={setId} onChange={(e) => setSetId(e.target.value)} className="mt-1">
                  {sets.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
                    Words ({selectedSet?.items.length ?? 0})
                  </span>
                </div>
                <ul className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                  {selectedSet?.items.map((i) => (
                    <li
                      key={i.id}
                      className="group flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm hover:border-primary/30 hover:bg-primary/[0.02] transition-colors"
                    >
                      <span className="font-medium text-txt">{i.word}</span>
                      <span className="text-xs text-txt-secondary text-right truncate max-w-[120px]">
                        {i.translation}
                      </span>
                    </li>
                  ))}
                  {selectedSet?.items.length === 0 && (
                    <li className="text-xs text-txt-secondary text-center py-8">
                      This set has no words yet.
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ── Center: Game Experience (Redesigned) ── */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-5 space-y-5">

              {/* Game Type Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentGameType?.emoji ?? "🎮"}</span>
                  <div>
                    <p className="font-heading font-semibold text-lg text-txt leading-tight">
                      {currentGameType?.label ?? "Unknown"}
                    </p>
                    <p className="text-xs text-txt-secondary">
                      {currentGameType?.description ?? ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTypeSelector(!showTypeSelector)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Change
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showTypeSelector && "rotate-180")} />
                </button>
              </div>

              {/* Collapsible Type Selector */}
              {showTypeSelector && (
                <div className="border border-border/60 rounded-xl p-4 bg-background/50 animate-fade-in">
                  <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
                    Choose a game type
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[240px] overflow-y-auto pr-1">
                    {GAME_TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => { setType(t.key); setShowTypeSelector(false); }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs transition-all text-left",
                          type === t.key
                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                            : "border-border/60 text-txt-secondary hover:border-primary/30 hover:bg-background"
                        )}
                      >
                        <span className="text-lg">{t.emoji}</span>
                        <span className="truncate">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Section */}
              <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-6 text-center">
                <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-4">
                  Preview
                </p>
                {preview ? (
                  <div className="space-y-4">
                    {renderPreview(type, preview)}
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => setMode("try")}
                      className="mt-2"
                    >
                      <PlayCircle className="h-4 w-4" /> Try this game now
                    </Button>
                  </div>
                ) : (
                  <div className="py-8">
                    <Grid3X3 className="w-10 h-10 mx-auto text-txt-secondary/40 mb-3" />
                    <p className="text-sm text-txt-secondary">
                      Add words to your vocabulary set to see a preview.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Right: Settings ── */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-5 space-y-5">
              <p className="font-heading font-semibold text-sm text-txt flex items-center gap-2">
                <Settings className="w-4 h-4 text-txt-secondary" />
                Settings
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-txt-secondary">Difficulty</Label>
                  <Select
                    value={settings.difficulty}
                    onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
                    className="mt-1"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-txt-secondary flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    Timer (seconds per question)
                  </Label>
                  <Input
                    type="number"
                    min={5}
                    value={settings.timer}
                    onChange={(e) => setSettings({ ...settings, timer: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={settings.hints}
                      onChange={(e) => setSettings({ ...settings, hints: e.target.checked })}
                      className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4"
                    />
                    <Lightbulb className="w-3.5 h-3.5 text-txt-secondary group-hover:text-primary transition-colors" />
                    <span className="text-txt group-hover:text-txt transition-colors">Hints</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={settings.audioAutoplay}
                      onChange={(e) => setSettings({ ...settings, audioAutoplay: e.target.checked })}
                      className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4"
                    />
                    <Volume2 className="w-3.5 h-3.5 text-txt-secondary group-hover:text-primary transition-colors" />
                    <span className="text-txt group-hover:text-txt transition-colors">Audio autoplay</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={settings.shuffle}
                      onChange={(e) => setSettings({ ...settings, shuffle: e.target.checked })}
                      className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4"
                    />
                    <Shuffle className="w-3.5 h-3.5 text-txt-secondary group-hover:text-primary transition-colors" />
                    <span className="text-txt group-hover:text-txt transition-colors">Shuffle questions</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-border/40 space-y-3">
                  <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
                    Publishing
                  </p>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4"
                    />
                    <CheckCircle2 className="w-3.5 h-3.5 text-txt-secondary group-hover:text-green-500 transition-colors" />
                    <span className="text-txt group-hover:text-txt transition-colors">Published</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isMarketplace}
                      onChange={(e) => setIsMarketplace(e.target.checked)}
                      className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-txt-secondary group-hover:text-amber-500 transition-colors" />
                    <span className="text-txt group-hover:text-txt transition-colors">List on marketplace</span>
                  </label>
                  {isMarketplace && (
                    <div className="animate-fade-in">
                      <Label className="text-xs font-medium text-txt-secondary">Price (USD)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ── Preview renderers ── */
function renderPreview(type: string, preview: { word: string; translation: string }) {
  switch (type) {
    case "FLASHCARD":
      return (
        <div className="inline-block bg-white border-2 border-primary/20 rounded-2xl px-12 py-10 shadow-lg">
          <p className="text-sm text-txt-secondary mb-2">FRONT</p>
          <p className="font-heading font-bold text-2xl text-txt">{preview.word}</p>
          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-sm text-txt-secondary mb-2">BACK</p>
            <p className="font-heading font-semibold text-xl text-primary">{preview.translation}</p>
          </div>
        </div>
      );
    case "QUIZ":
    case "FILL_BLANK":
    case "SPEED_ROUND":
      return (
        <div className="max-w-xs mx-auto space-y-3">
          <p className="font-heading font-semibold text-txt">
            What does "<span className="text-primary">{preview.word}</span>" mean?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[preview.translation, "Option B", "Option C", "Option D"].map((o, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl border py-3 px-4 text-sm font-medium transition-all",
                  i === 0
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-card text-txt-secondary"
                )}
              >
                {o}
              </div>
            ))}
          </div>
        </div>
      );
    case "MEMORY":
      return (
        <div className="grid grid-cols-4 gap-2 max-w-[200px] mx-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-xl shadow-sm transition-all",
                i % 2 === 0 ? "bg-primary/20" : "bg-primary/40"
              )}
            />
          ))}
        </div>
      );
    default:
      return (
        <div className="py-4">
          <div className="inline-flex items-center gap-3 bg-white border border-border/60 rounded-xl px-6 py-4 shadow-sm">
            <span className="text-2xl">{GAME_TYPES.find((t) => t.key === type)?.emoji ?? "🎮"}</span>
            <div className="text-left">
              <p className="font-heading font-semibold text-txt">{preview.word}</p>
              <p className="text-sm text-txt-secondary">→ {preview.translation}</p>
            </div>
          </div>
        </div>
      );
  }
}
