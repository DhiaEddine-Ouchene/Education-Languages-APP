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
  ChevronDown,
  Timer,
  Lightbulb,
  Shuffle,
  Volume2,
  CheckCircle2,
  Grid3X3,
} from "lucide-react";
import { GamePlayer } from "@/components/games/GamePlayer";
import type { GameItem, GameSettings } from "@/components/games/types";
import { buildFolderGame } from "@/lib/folder-game-data";
import { SchemaBuilder } from "@/components/dashboard/builders/SchemaBuilder";
import { getGameTypeMeta } from "@/lib/game-type-metadata";
import { hasEngineContent } from "@/lib/builder-schemas";

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
  { key: "SITUATION_DIALOGUE_FILL", label: "Dialogue fill", emoji: "💬", description: "Complete conversations" },
  { key: "WORD_SCRAMBLE", label: "Word scramble", emoji: "🔀", description: "Unscramble letters to form words" },
  // Grammar
  { key: "SENTENCE_BUILDER", label: "Sentence builder", emoji: "🏗️", description: "Arrange words into correct sentences" },
  { key: "ERROR_SPOTTING", label: "Error spotting", emoji: "🔎", description: "Find grammar mistakes" },
  { key: "VERB_CONJUGATION", label: "Verb conjugation", emoji: "🔄", description: "Conjugate verbs in different tenses" },
  { key: "MULTIPLE_CHOICE_GRAMMAR", label: "MC grammar", emoji: "☑️", description: "Choose the grammatically correct option" },
  // Listening & Speaking
  { key: "LISTEN_FILL_WORD", label: "Listen fill word", emoji: "🎧", description: "Listen and fill in missing words" },
  { key: "LISTEN_FILL_SENTENCE", label: "Listen fill sentence", emoji: "🔊", description: "Listen and reconstruct sentences" },
  { key: "SPEAK_FILL_WORD", label: "Speak fill word", emoji: "🎙️", description: "Speak the missing word aloud" },
  { key: "SPEAK_FILL_SENTENCE", label: "Speak fill sentence", emoji: "🗣️", description: "Speak complete sentences" },
] as const;

type GameType = (typeof GAME_TYPES)[number]["key"];
type FlashPair = { word: string; translation: string; exampleSentence?: string | null; audioUrl?: string | null; imageUrl?: string | null };
type Props = {
  initial?: {
    id: string;
    title: string;
    type: string;
    settings: Record<string, unknown>;
    flashcardPairs?: FlashPair[];
    isPublished: boolean;
  };
};

// Build preview items from the game's own content (settings + flashcard pairs).
function itemsFromContent(settings: Record<string, any>, flashcardPairs?: FlashPair[]): GameItem[] {
  const out: GameItem[] = [];
  if (flashcardPairs?.length) {
    flashcardPairs.forEach((p, idx) => out.push({
      id: `pair-${idx}`, word: p.word, translation: p.translation,
      audioUrl: p.audioUrl ?? null, imageUrl: p.imageUrl ?? null, exampleSentence: p.exampleSentence ?? null,
    }));
  }
  if (Array.isArray(settings.pairs)) {
    settings.pairs.forEach((p: any, idx: number) => out.push({
      id: `spair-${idx}`, word: p.word || "", translation: p.translation || "",
      audioUrl: null, imageUrl: null, exampleSentence: p.exampleSentence || null,
    }));
  }
  if (Array.isArray(settings.sentenceItems)) {
    settings.sentenceItems.forEach((s: any, idx: number) => out.push({
      id: `ssf-${idx}`, word: s.correctAnswer || "", translation: s.sentence || "",
      audioUrl: null, imageUrl: null, exampleSentence: s.sentence || null,
    }));
  }
  if (Array.isArray(settings.speakingItems)) {
    settings.speakingItems.forEach((s: any, idx: number) => out.push({
      id: `sspk-${idx}`, word: s.display || s.target || s.audioText || "",
      mode: s.mode || "", display: s.display || "", target: s.target || "",
      keywords: s.keywords || [], note: s.note || "", task: s.task || "",
      audioUrl: null, imageUrl: null, exampleSentence: null,
    } as GameItem));
  }
  return out;
}

export function GameBuilder({ initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"build" | "try">("build");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<GameType>((initial?.type as GameType) ?? "FLASHCARD");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const s = (initial?.settings ?? {}) as Record<string, any>;
  // Preserve the game's rich content (speakingItems, sentenceItems, sortItems,
  // writingData, …) alongside the base play settings so the editor's "Try"
  // preview actually represents the game instead of dropping it.
  const [settings, setSettings] = useState<GameSettings & Record<string, any>>({
    difficulty: (s.difficulty as string) ?? "medium",
    timer: (s.timer as number) ?? 30,
    hints: (s.hints as boolean) ?? true,
    audioAutoplay: (s.audioAutoplay as boolean) ?? false,
    shuffle: (s.shuffle as boolean) ?? true,
    ...s,
  });
  const previewItems = useMemo<GameItem[]>(
    () => itemsFromContent({ ...s, ...settings }, initial?.flashcardPairs),
    [s, settings, initial?.flashcardPairs]
  );

  // ── Content editor (SchemaBuilder) ──
  // Seed engine-ready `data`: prefer stored `settings.data`; otherwise migrate the
  // game's legacy content (settings keys / flashcard pairs) into engine data using
  // the very same derivation the player uses — so pre-existing games open editable.
  const seedEngineData = (t: string): Record<string, unknown> => {
    const merged = { ...s, ...settings };
    if (merged.data && hasEngineContent(t, merged.data as Record<string, unknown>)) {
      return merged.data as Record<string, unknown>;
    }
    try {
      return (buildFolderGame(t, merged, previewItems).data as Record<string, unknown>) || {};
    } catch {
      return {};
    }
  };
  const [builderData, setBuilderData] = useState<Record<string, unknown>>(() => seedEngineData(initial?.type ?? "FLASHCARD"));
  const [builderValid, setBuilderValid] = useState(false);
  const [builderKey, setBuilderKey] = useState(0);
  const editorMeta = getGameTypeMeta(type);

  const currentGameType = GAME_TYPES.find((t) => t.key === type);

  const save = async () => {
    if (title.trim().length < 3) return setError("Title must be at least 3 characters");
    setError("");
    setSaving(true);
    try {
      const res = await fetch(initial ? `/api/games/${initial.id}` : "/api/games", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, settings: { ...settings, data: builderData }, isPublished }),
      });
      if (!res.ok) { toast("error", "Failed to save game"); return; }
      toast("success", initial ? "Game updated" : "Game created");
      router.push("/dashboard/games");
      router.refresh();
    } finally { setSaving(false); }
  };

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
              <Button variant={mode === "build" ? "primary" : "outline"} size="sm" onClick={() => setMode("build")}>
                <Settings className="h-4 w-4" /> Builder
              </Button>
              <Button variant={mode === "try" ? "accent" : "outline"} size="sm" onClick={() => setMode("try")}>
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
            settings={{ ...settings, data: builderData }}
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* ── Center: Game Experience ── */}
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
                        onClick={() => { setType(t.key); setShowTypeSelector(false); setBuilderData({}); setBuilderValid(false); setBuilderKey((k) => k + 1); }}
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

              {/* Content editor */}
              {editorMeta ? (
                <SchemaBuilder
                  key={`${type}:${builderKey}`}
                  gameMeta={editorMeta}
                  initial={builderData}
                  onChange={setBuilderData}
                  onValidation={setBuilderValid}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-6 text-center py-8">
                  <Grid3X3 className="w-10 h-10 mx-auto text-txt-secondary/40 mb-3" />
                  <p className="text-sm text-txt-secondary">This game type isn’t editable here yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Right: Settings ── */}
          <Card className="shadow-sm border-border/60 self-start">
            <CardContent className="pt-5 space-y-5">
              <p className="font-heading font-semibold text-sm text-txt flex items-center gap-2">
                <Settings className="w-4 h-4 text-txt-secondary" />
                Settings
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-txt-secondary">Difficulty</Label>
                  <Select value={settings.difficulty} onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })} className="mt-1">
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
                  <Input type="number" min={5} value={settings.timer} onChange={(e) => setSettings({ ...settings, timer: Number(e.target.value) })} className="mt-1" />
                </div>

                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input type="checkbox" checked={settings.hints} onChange={(e) => setSettings({ ...settings, hints: e.target.checked })} className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4" />
                    <Lightbulb className="w-3.5 h-3.5 text-txt-secondary group-hover:text-primary transition-colors" />
                    <span className="text-txt group-hover:text-txt transition-colors">Hints</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input type="checkbox" checked={settings.audioAutoplay} onChange={(e) => setSettings({ ...settings, audioAutoplay: e.target.checked })} className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4" />
                    <Volume2 className="w-3.5 h-3.5 text-txt-secondary group-hover:text-primary transition-colors" />
                    <span className="text-txt group-hover:text-txt transition-colors">Audio autoplay</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input type="checkbox" checked={settings.shuffle} onChange={(e) => setSettings({ ...settings, shuffle: e.target.checked })} className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4" />
                    <Shuffle className="w-3.5 h-3.5 text-txt-secondary group-hover:text-primary transition-colors" />
                    <span className="text-txt group-hover:text-txt transition-colors">Shuffle questions</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-border/40 space-y-3">
                  <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Publishing</p>
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4" />
                    <CheckCircle2 className="w-3.5 h-3.5 text-txt-secondary group-hover:text-green-500 transition-colors" />
                    <span className="text-txt group-hover:text-txt transition-colors">Published</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
