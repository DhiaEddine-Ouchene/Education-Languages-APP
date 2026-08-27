"use client";

import { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { GamePreviewModal } from "@/components/dashboard/GamePreviewModal";
import { GamePoster } from "@/components/dashboard/GamePoster";
import { SchemaBuilder } from "@/components/dashboard/builders/SchemaBuilder";
import { WordBank } from "@/components/dashboard/builders/WordBank";
import type { ChipData, ExistingSet } from "@/components/dashboard/builders/WordBank";
import { aiToEngineData } from "@/lib/ai-to-engine";
import { hasEngineContent } from "@/lib/builder-schemas";
import { buildEngineDataFromItems, isInstantFillType, itemsFromChips } from "@/lib/fill-game";
import {
  GAME_TYPES,
  CATEGORY_META,
  getGameTypesByCategory,
  getGameTypeMeta,
  VOCAB_CONTENT_LABELS,
  type GameCategory,
  type GameTypeMeta,
} from "@/lib/game-type-metadata";
import {
  BookOpen, PenTool, Headphones, Edit3, Mic,
  ArrowLeft, Save, Settings, Timer, Lightbulb,
  Shuffle, Volume2, CheckCircle2, ChevronRight,
  Sparkles, Eye, Check, Lightbulb as LightbulbIcon, PlayCircle,
} from "lucide-react";

// ── Icon map ──
const ICON_MAP: Record<string, React.ElementType> = { BookOpen, PenTool, Headphones, Edit3, Mic };

type Props = {
  educatorId: string;
};

export function UnifiedGameCreator({ educatorId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get("type");

  // ── Wizard state ──
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(() => {
    if (preselectedType && getGameTypeMeta(preselectedType)) return 3;
    return 1;
  });

  // Step 1: Category
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | null>(() => {
    if (preselectedType) {
      const meta = getGameTypeMeta(preselectedType);
      return meta?.category ?? null;
    }
    return null;
  });

  // Step 2: Game type
  const [selectedTemplate, setSelectedTemplate] = useState<GameTypeMeta | null>(() => {
    if (preselectedType) {
      return getGameTypeMeta(preselectedType) ?? null;
    }
    return null;
  });

  // Step 3: Configuration
  const [title, setTitle] = useState(preselectedType ? (getGameTypeMeta(preselectedType)?.title ?? "") : "");
  const [language, setLanguage] = useState("English");
  const [level, setLevel] = useState("B1");
  const [gameConfig, setGameConfig] = useState<Record<string, any>>({
    optionsCount: 4,
    gridSize: 8,
    audioSource: "text-to-speech",
    storyPrompt: "",
  });
  const [settings, setSettings] = useState({
    difficulty: "medium",
    timer: 30,
    hints: true,
    audioAutoplay: false,
    shuffle: true,
    isPublished: false,
  });
  const [saving, setSaving] = useState(false);

  // Builder state
  const [builderData, setBuilderData] = useState<Record<string, unknown>>({});
  const [builderValid, setBuilderValid] = useState(false);
  const [builderKey, setBuilderKey] = useState(0);
  const [generatingGame, setGeneratingGame] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<"ready" | "needs_review" | null>(null);

  // Word bank state
  const [wordBankWords, setWordBankWords] = useState<ChipData[]>([]);
  const [nativeLang, setNativeLang] = useState("English");

  // Reusable, game-agnostic saved sets (loaded once for this teacher).
  const [existingSets, setExistingSets] = useState<ExistingSet[]>([]);
  const loadSets = useCallback(async () => {
    try {
      const res = await fetch("/api/word-sets");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setExistingSets(data);
    } catch {
      /* sets are optional — ignore fetch errors */
    }
  }, []);
  useEffect(() => { loadSets(); }, [loadSets]);

  // Preview modal state (for step 2 and step 3)
  const [previewGame, setPreviewGame] = useState<GameTypeMeta | null>(null);
  const [showBuilderPreview, setShowBuilderPreview] = useState(false);

  const gamesInCategory = selectedCategory ? getGameTypesByCategory(selectedCategory) : [];
  const currentGameType = selectedTemplate;

  // Preview is available once the builder holds engine-ready content (rounds /
  // pairs / entries / prompt / rules) OR the teacher has a vocabulary set that
  // item-derived engines (flashcard, memory, …) can build a game from.
  const canPreview = useMemo(() => {
    if (!currentGameType) return false;
    if (hasEngineContent(currentGameType.type, builderData)) return true;
    return wordBankWords.length >= 2;
  }, [currentGameType, builderData, wordBankWords]);

  // ── Navigation helpers ──
  const selectCategory = (cat: GameCategory) => {
    setSelectedCategory(cat);
    setWizardStep(2);
  };

  const selectTemplate = (t: GameTypeMeta) => {
    setSelectedTemplate(t);
    setTitle(t.title);
    // New game type ⇒ start the builder from a clean slate and remount it.
    setBuilderData({});
    setBuilderValid(false);
    setGenerationStatus(null);
    setBuilderKey((k) => k + 1);
    setWizardStep(3);
  };

  const goBack = () => {
    if (wizardStep === 3) {
      setWizardStep(2);
      setSelectedTemplate(null);
    } else if (wizardStep === 2) {
      setWizardStep(1);
      setSelectedCategory(null);
    }
  };

  // ── Game Generation ──
  const handleGenerateGame = async (providedWords?: ChipData[]) => {
    const effectiveWords = providedWords !== undefined ? providedWords : wordBankWords;
    if (!selectedTemplate) return;
    if (effectiveWords.length === 0) {
      toast("error", "Please add words to the word bank first.");
      return;
    }
    setGeneratingGame(true);
    setGenerationStatus(null);
    try {
      const res = await fetch("/api/ai/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: selectedTemplate.type,
          words: effectiveWords.map((w) => ({
            word: w.word,
            translation: w.translation,
            exampleSentence: w.exampleSentence,
          })),
          count: 10,
          options: {
            targetLang: language,
            nativeLang,
          },
        }),
      });
      const result = await res.json();

      if (!res.ok && result.status !== "needs_review") {
        throw new Error(result.error || "Generation failed");
      }

      if (result.status === "needs_review") {
        setGenerationStatus("needs_review");
        toast("error", "Generation needs review");
      } else {
        setGenerationStatus("ready");
        toast("success", "Game content generated!");
      }

      // Pre-fill builder with generated data
      if (result.data) {
        // Convert the AI's per-type `{ items: [...] }` output directly into
        // engine-ready `data`, then remount the SchemaBuilder so it re-seeds
        // from this `initial` (it only seeds on mount).
        setBuilderData(aiToEngineData(selectedTemplate.type, result.data));
        setBuilderKey((k) => k + 1);
      }
    } catch (err: any) {
      // AI is unavailable — don't leave the teacher stuck. Fall back to the
      // deterministic build from their words so the game is still populated
      // (they can refine it by hand or retry AI later).
      const fallback = buildEngineDataFromItems(selectedTemplate.type, itemsFromChips(effectiveWords));
      if (hasEngineContent(selectedTemplate.type, fallback.data)) {
        setBuilderData(fallback.data);
        setBuilderKey((k) => k + 1);
        setGenerationStatus("needs_review");
        toast("error", "AI unavailable — added a basic version from your words. Please review it.");
      } else {
        toast("error", err.message || "Failed to generate game content");
      }
    } finally {
      setGeneratingGame(false);
    }
  };

  // ── Fill the game from the current content list (AI-generated, manual, or a set) ──
  // Instant for simple types (flashcard, memory, match, meaning MCQ, scramble);
  // AI-shaped for structured types (crossword, category sort, dialogue, grammar …).
  const handleFillGame = async (providedWords?: ChipData[]) => {
    const effectiveWords = providedWords !== undefined ? providedWords : wordBankWords;
    if (!selectedTemplate) return;
    if (effectiveWords.length < 2) {
      toast("error", "Add at least 2 items to fill the game.");
      return;
    }
    const { data, viaAI, instant } = buildEngineDataFromItems(
      selectedTemplate.type,
      itemsFromChips(effectiveWords)
    );
    if (instant && !viaAI) {
      setBuilderData(data);
      setBuilderKey((k) => k + 1);
      setGenerationStatus("ready");
      toast("success", `Filled ${effectiveWords.length} items into your game!`);
      return;
    }
    // Structured type → let the AI shape the items (falls back to `data` on failure).
    await handleGenerateGame(effectiveWords);
  };

  // ── Save handler ──
  const handleSave = async () => {
    if (!selectedTemplate) return;
    if (title.trim().length < 2) { toast("error", "Please enter a game title"); return; }

    // Validate: the builder holds engine-ready content, or there's a vocab set
    // that item-derived engines can build from.
    const hasBuilderContent = hasEngineContent(selectedTemplate.type, builderData);
    const hasVocab = wordBankWords.length >= 2;
    if (!hasBuilderContent && !hasVocab) {
      toast("error", "Please add game content using the builder or a vocabulary set");
      return;
    }

    setSaving(true);
    try {
      const gameRes = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type: selectedTemplate.type,
          settings: {
            ...settings,
            ...gameConfig,
            // Engine-ready content from the SchemaBuilder. `buildFolderGame`
            // passes `settings.data` through unchanged to the play engine, so
            // preview and live student play render identical content.
            data: hasBuilderContent ? builderData : undefined,
            items: wordBankWords.map((w) => ({
              word: w.word,
              translation: w.translation,
              exampleSentence: w.exampleSentence || "",
            })),
          },
          isPublished: settings.isPublished,
        }),
      });

      if (!gameRes.ok) {
        const err = await gameRes.json();
        throw new Error(err.error || "Failed to create game");
      }

      const game = await gameRes.json();
      toast("success", `"${title}" created!`);
      router.push(`/dashboard/games/${game.id}`);
      router.refresh();
    } catch (err: any) {
      toast("error", err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────
  // STEP 1: Choose Category
  // ──────────────────────────────────────
  if (wizardStep === 1) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl text-txt">Create New Game</h1>
            <p className="text-sm text-txt-secondary">Choose a skill category to get started</p>
          </div>
        </div>

        {/* Category Cards — 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(CATEGORY_META) as GameCategory[]).map((key) => {
            const cat = CATEGORY_META[key];
            const Icon = ICON_MAP[cat.icon] || BookOpen;
            const count = getGameTypesByCategory(key).length;
            return (
              <button
                key={key}
                onClick={() => selectCategory(key)}
                className={cn(
                  "text-left p-6 rounded-2xl border-2 transition-all duration-300 group",
                  "hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                )}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", cat.bgColor, cat.color)}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-txt">{cat.title}</h3>
                    <p className="text-xs text-txt-secondary mt-0.5">{cat.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">{count} games</span>
                  <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Explore <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────
  // STEP 2: Select Game
  // ──────────────────────────────────────
  if (wizardStep === 2 && selectedCategory) {
    const catMeta = CATEGORY_META[selectedCategory];

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Wizard Stepper */}
        <WizardStepper currentStep={2} onStepClick={(s) => {
          if (s === 1) goBack();
        }} />

        {/* Header */}
        <div className="flex items-start md:items-center gap-3">
          <button onClick={goBack} className="p-2 rounded-xl hover:bg-border/50 transition-colors shrink-0 mt-1 md:mt-0">
            <ArrowLeft className="w-5 h-5 text-txt-secondary" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-xl md:text-2xl text-txt leading-tight">Available {catMeta.title} Games</h1>
            <p className="text-xs md:text-sm text-txt-secondary mt-1 md:mt-0">
              Select the activity that best fits your lesson plan
            </p>
          </div>
        </div>

        {/* Game Cards List */}
        <div className="flex flex-col gap-4">
          {gamesInCategory.map((game) => (
            <GameSelectCard
              key={game.type}
              game={game}
              onPreview={() => setPreviewGame(game)}
              onSelect={() => selectTemplate(game)}
            />
          ))}
        </div>

        {/* Teacher Tip */}
        <div className="p-5 bg-primary-light/50 text-txt rounded-2xl flex items-start gap-4 border border-primary/10">
          <LightbulbIcon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm mb-1">Teacher Tip</p>
            <p className="text-sm text-txt-secondary leading-relaxed">
              Interactive games increase student engagement by up to 40%. Start with popular games like
              &quot;Flashcard&quot; or &quot;Odd One Out&quot; to build familiarity, then progress to
              creation-based tasks like &quot;Sentence Builder&quot;.
            </p>
          </div>
        </div>

        {/* Preview Modal */}
        {previewGame && (
          <GamePreviewModal
            isOpen={true}
            onClose={() => setPreviewGame(null)}
            gameType={previewGame.type}
            gameTitle={previewGame.title}
          />
        )}
      </div>
    );
  }

  // ──────────────────────────────────────
  // STEP 3: Configure
  // ──────────────────────────────────────
  const vocabHint = currentGameType
    ? VOCAB_CONTENT_LABELS[currentGameType.vocabContentType]
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Wizard Stepper */}
      <WizardStepper currentStep={3} onStepClick={(s) => {
        if (s === 1) { setWizardStep(1); setSelectedCategory(null); setSelectedTemplate(null); }
        if (s === 2) goBack();
      }} />

      {/* Back + Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-[240px]">
          <button onClick={goBack} className="p-2 rounded-xl hover:bg-border/50 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-txt-secondary" />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
            <span className="text-2xl hidden sm:block shrink-0">{currentGameType?.emoji}</span>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-xl md:text-2xl text-txt leading-tight flex items-center gap-2 truncate">
                <span className="sm:hidden shrink-0">{currentGameType?.emoji}</span>
                <span className="truncate">{currentGameType?.title}</span>
              </h1>
              <p className="text-xs md:text-sm text-txt-secondary mt-1 md:mt-0 truncate">{currentGameType?.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setShowBuilderPreview(true)}
            disabled={!canPreview}
          >
            <PlayCircle className="w-4 h-4" /> Preview
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Create Game"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Left: Word Bank */}
        <div className="lg:sticky lg:top-24 self-start">
          <WordBank
            words={wordBankWords}
            onWordsChange={setWordBankWords}
            contentType={currentGameType?.vocabContentType ?? "words"}
            existingSets={existingSets}
            language={language}
            level={level}
            onLanguageChange={setLanguage}
            onLevelChange={setLevel}
            onNativeLangChange={setNativeLang}
            onSetSaved={() => loadSets()}
            onAiGenerateComplete={(generatedWords) => { handleFillGame(generatedWords); }}
          />
        </div>

        {/* Right: Builder Workspace + Settings */}
        <div className="space-y-4 min-w-0">
          {/* Generation Banner */}
          {generationStatus === "needs_review" && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-start gap-3 text-yellow-800">
              <div className="mt-0.5"><Lightbulb className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <h4 className="font-semibold text-sm">Review Needed</h4>
                <p className="text-xs opacity-90 mt-1">The AI struggled to generate perfect content for this word bank. Please review the items below carefully and fix any mistakes before saving.</p>
              </div>
            </div>
          )}

          {/* Fill Game from the content list (AI items, manual, or a saved set) */}
          <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center justify-between gap-3">
             <div className="flex items-center gap-3 text-txt min-w-0">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                   <h3 className="font-semibold text-sm">Fill this game from your word bank</h3>
                   <p className="text-xs text-txt-secondary truncate">
                      {currentGameType && isInstantFillType(currentGameType.type)
                        ? "Builds instantly from your list — no AI needed."
                        : "Uses AI to shape your list into this game's format."}
                   </p>
                </div>
             </div>
             <Button
                onClick={() => handleFillGame()}
                disabled={generatingGame || wordBankWords.length < 2}
                variant={builderData && Object.keys(builderData).length > 0 ? "outline" : "primary"}
                className="shrink-0"
             >
                {generatingGame
                  ? "Filling..."
                  : (builderData && Object.keys(builderData).length > 0 ? "Refill Game" : "Fill Game With These")}
             </Button>
          </div>

          {/* Title */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={currentGameType ? `Enter a title for your ${currentGameType.title}...` : "Enter a game title..."}
              className="text-lg font-heading font-semibold"
            />
          </div>

          {/* Dynamic Builder */}
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-gradient-to-r from-primary/[0.02] to-transparent">
              <span className="text-lg">{currentGameType?.emoji}</span>
              <div>
                <h3 className="font-heading font-semibold text-sm text-txt">{currentGameType?.title} Builder</h3>
                <p className="text-[10px] text-txt-secondary">Add items from the word bank or type them manually</p>
              </div>
            </div>
            <div className="p-4">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-txt-secondary">Loading builder...</span>
                </div>
              }>
              {currentGameType && (
                <SchemaBuilder
                  key={`${currentGameType.type}:${builderKey}`}
                  gameMeta={currentGameType}
                  initial={builderData}
                  onChange={setBuilderData}
                  onValidation={setBuilderValid}
                  generating={generatingGame}
                />
              )}
              </Suspense>
            </div>
          </div>

          {/* Settings - collapsible panel */}
          <SettingsPanel settings={settings} setSettings={setSettings} currentGameType={currentGameType} />

          {/* Bottom save */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-end pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setShowBuilderPreview(true)}
              disabled={!canPreview}
            >
              <PlayCircle className="w-4 h-4" /> Preview Game
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? "Creating..." : "Create Game"}
            </Button>
          </div>
        </div>
      </div>

      {/* Builder Preview Modal */}
      {showBuilderPreview && currentGameType && (
        <GamePreviewModal
          isOpen={true}
          onClose={() => setShowBuilderPreview(false)}
          gameType={currentGameType.type}
          gameTitle={title || currentGameType.title}
          customItems={wordBankWords.map((w, i) => ({
            id: `wb-${i}`,
            word: w.word,
            translation: w.translation,
            audioUrl: null,
            imageUrl: null,
            exampleSentence: w.exampleSentence || null,
          })) as any}
          settings={{ ...settings, ...gameConfig, data: builderData }}
        />
      )}
    </div>
  );
}

// ── Settings Panel Component ──
function SettingsPanel({
  settings,
  setSettings,
  currentGameType,
}: {
  settings: any;
  setSettings: (s: any) => void;
  currentGameType: GameTypeMeta | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-background/50 transition-colors"
      >
        <p className="font-heading font-semibold text-sm text-txt flex items-center gap-2">
          <Settings className="w-4 h-4 text-txt-secondary" />
          Game Settings
        </p>
        <ChevronRight className={cn("w-4 h-4 text-txt-secondary transition-transform", isOpen && "rotate-90")} />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-4">
          <div>
            <label className="text-xs font-medium text-txt-secondary mb-1 block">Difficulty</label>
            <select value={settings.difficulty} onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-txt-secondary mb-1 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" /> Timer (seconds)
            </label>
            <Input type="number" min={5} value={settings.timer} onChange={(e) => setSettings({ ...settings, timer: Number(e.target.value) })} />
          </div>
          <div className="space-y-2.5 pt-2 border-t border-border/40">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input type="checkbox" checked={settings.hints} onChange={(e) => setSettings({ ...settings, hints: e.target.checked })}
                className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4" />
              <span className="text-txt">Hints</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input type="checkbox" checked={settings.audioAutoplay} onChange={(e) => setSettings({ ...settings, audioAutoplay: e.target.checked })}
                className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4" />
              <span className="text-txt">Audio autoplay</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input type="checkbox" checked={settings.shuffle} onChange={(e) => setSettings({ ...settings, shuffle: e.target.checked })}
                className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4" />
              <span className="text-txt">Shuffle</span>
            </label>
          </div>
          <div className="pt-3 border-t border-border/40">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input type="checkbox" checked={settings.isPublished} onChange={(e) => setSettings({ ...settings, isPublished: e.target.checked })}
                className="rounded border-border/60 text-primary focus:ring-primary/30 w-4 h-4" />
              <span className="text-txt">Publish immediately</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wizard Stepper Component ──
function WizardStepper({
  currentStep,
  onStepClick,
}: {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
}) {
  const steps = [
    { num: 1 as const, label: "Choose Category" },
    { num: 2 as const, label: "Select Game" },
    { num: 3 as const, label: "Configure" },
  ];

  return (
    <div className="flex items-center justify-center max-w-xl mx-auto w-full relative px-4 py-4">
      {/* Background line */}
      <div className="absolute top-[22px] left-12 right-12 h-0.5 bg-border -z-0" />

      {steps.map((step, i) => {
        const isCompleted = currentStep > step.num;
        const isActive = currentStep === step.num;
        return (
          <button
            key={step.num}
            onClick={() => {
              if (step.num < currentStep) onStepClick(step.num);
            }}
            className={cn(
              "flex flex-col items-center gap-1.5 z-10 relative bg-background px-4",
              step.num < currentStep && "cursor-pointer"
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all",
                isActive && "bg-primary text-white ring-4 ring-primary/20 scale-110",
                isCompleted && "bg-green-600 text-white",
                !isActive && !isCompleted && "bg-border text-txt-secondary"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : step.num}
            </div>
            <span
              className={cn(
                "text-xs font-semibold",
                isActive ? "text-primary" : "text-txt-secondary"
              )}
            >
              {step.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Game Selection Card (Step 2) ──
function GameSelectCard({
  game,
  onPreview,
  onSelect,
}: {
  game: GameTypeMeta;
  onPreview: () => void;
  onSelect: () => void;
}) {
  const catMeta = CATEGORY_META[game.category];
  const Icon = ICON_MAP[catMeta.icon] || BookOpen;

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col gap-4 p-5 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 md:flex-row md:gap-5">
      {/* Visual area — game screenshot (hidden on mobile to save space) */}
      <GamePoster
        type={game.type}
        title={game.title}
        className="hidden md:block md:w-52 flex-shrink-0 rounded-xl"
      />

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title + badge row */}
        <div className="flex flex-wrap items-start gap-2 mb-2">
          <h3 className="font-heading font-semibold text-base text-txt">{game.title}</h3>
          {game.popular && (
            <span className="bg-primary/10 text-primary text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
              Most Popular
            </span>
          )}
        </div>

        <p className="text-xs text-txt-secondary mb-3">{game.description}</p>

        {/* Learning Objectives */}
        <div className="mb-3">
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold mb-1.5">
            Learning Objectives
          </p>
          <div className="flex flex-wrap gap-1.5">
            {game.objectives.map((obj) => (
              <span
                key={obj}
                className="bg-background px-2.5 py-1 rounded-full text-[11px] text-txt-secondary border border-border/40"
              >
                {obj}
              </span>
            ))}
          </div>
        </div>

        {/* Actions — full width on mobile, inline on desktop */}
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <button
            onClick={onPreview}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-primary text-sm font-medium hover:bg-primary/5 rounded-lg border border-primary/20 sm:border-transparent transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview Game
          </button>
          <button
            onClick={onSelect}
            className="sm:ml-auto bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
          >
            Select and Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
