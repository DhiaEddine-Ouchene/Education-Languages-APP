"use client";

import { useState, useMemo, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { SelectCustom, type SelectOption } from "@/components/ui/select-custom";
import { VocabularySetCreator, type VocabWord } from "@/components/dashboard/VocabularySetCreator";
import { GamePreviewModal } from "@/components/dashboard/GamePreviewModal";
import { GamePreviewImage } from "@/components/dashboard/GamePreviewImage";
import { getBuilderForGameType } from "@/components/dashboard/builders";
import { WordBank } from "@/components/dashboard/builders/WordBank";
import type { ChipData } from "@/components/dashboard/builders/WordBank";
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
  BookOpen, PenTool, Headphones, Edit3,
  ArrowLeft, Save, Settings, Timer, Lightbulb,
  Shuffle, Volume2, CheckCircle2, ChevronRight,
  Sparkles, Eye, Check, Lightbulb as LightbulbIcon, PlayCircle,
} from "lucide-react";

// ── Icon map ──
const ICON_MAP: Record<string, React.ElementType> = { BookOpen, PenTool, Headphones, Edit3 };

type ExistingSet = {
  id: string;
  name: string;
  items: { id: string; word: string; translation: string; exampleSentence?: string }[];
};

type Props = {
  educatorId: string;
  existingSets: ExistingSet[];
};

export function UnifiedGameCreator({ educatorId, existingSets }: Props) {
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
  const [vocabMode, setVocabMode] = useState<"ai" | "existing">("ai");
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);
  const [selectedSetId, setSelectedSetId] = useState(existingSets[0]?.id ?? "");
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

  // Word bank state
  const [wordBankWords, setWordBankWords] = useState<ChipData[]>([]);

  // Preview modal state (for step 2 and step 3)
  const [previewGame, setPreviewGame] = useState<GameTypeMeta | null>(null);
  const [showBuilderPreview, setShowBuilderPreview] = useState(false);

  const gamesInCategory = selectedCategory ? getGameTypesByCategory(selectedCategory) : [];
  const currentGameType = selectedTemplate;

  const setOptions: SelectOption[] = existingSets.map((s) => ({
    value: s.id,
    label: s.name,
    description: `${s.items.length} items`,
  }));

  const selectedExistingSet = existingSets.find((s) => s.id === selectedSetId);
  const finalWords = vocabMode === "existing" ? (selectedExistingSet?.items ?? []) : vocabWords;

  // Build preview items from builder data
  const previewItems = useMemo(() => {
    if (!builderData) return [];
    // For pair-based builders
    if (builderData.pairs && Array.isArray(builderData.pairs)) {
      return (builderData.pairs as any[]).map((p: any, i: number) => ({
        id: `preview-${i}`,
        word: p.word || "",
        translation: p.translation || "",
        audioUrl: null,
        imageUrl: null,
        exampleSentence: p.exampleSentence || null,
      }));
    }
    // For sentence-fill builders
    if (builderData.sentenceItems && Array.isArray(builderData.sentenceItems)) {
      return (builderData.sentenceItems as any[]).map((s: any, i: number) => ({
        id: `preview-${i}`,
        word: s.correctAnswer || "",
        translation: s.sentence || "",
        audioUrl: null,
        imageUrl: null,
        exampleSentence: s.sentence || null,
      }));
    }
    // For synonym/antonym builder
    if (builderData.synonymItems && Array.isArray(builderData.synonymItems)) {
      return (builderData.synonymItems as any[]).map((s: any, i: number) => ({
        id: `preview-${i}`,
        word: s.word || "",
        synonym: s.synonym || "",
        antonym: s.antonym || "",
        audioUrl: null,
        imageUrl: null,
      }));
    }
    return [];
  }, [builderData]);

  // ── Navigation helpers ──
  const selectCategory = (cat: GameCategory) => {
    setSelectedCategory(cat);
    setWizardStep(2);
  };

  const selectTemplate = (t: GameTypeMeta) => {
    setSelectedTemplate(t);
    setTitle(t.title);
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

  // ── Save handler ──
  const handleSave = async () => {
    if (!selectedTemplate) return;
    if (title.trim().length < 2) { toast("error", "Please enter a game title"); return; }

    // Validate: either builder data exists or vocabulary set has items
    const hasBuilderContent = builderData && Object.keys(builderData).length > 0;
    const hasVocab = finalWords.length >= 2 || vocabMode === "existing";
    if (!hasBuilderContent && !hasVocab) {
      toast("error", "Please add game content using the builder or a vocabulary set");
      return;
    }

    setSaving(true);
    try {
      let vocabSetId: string | undefined;
      if (vocabMode === "ai" && vocabWords.length > 0) {
        const vocabRes = await fetch("/api/vocabulary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${title} - Vocabulary`,
            language,
            items: vocabWords.map((w) => ({
              word: w.word,
              translation: w.translation,
              exampleSentence: w.exampleSentence || "",
            })),
          }),
        });
        if (!vocabRes.ok) throw new Error("Failed to create vocabulary set");
        const vocabData = await vocabRes.json();
        vocabSetId = vocabData.id;
      } else if (vocabMode === "existing") {
        vocabSetId = selectedSetId;
      }

      const gameRes = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type: selectedTemplate.type,
          vocabularySetId: vocabSetId || null,
          settings: {
            ...settings,
            ...gameConfig,
            items: finalWords.map((w) => ({
              word: w.word,
              translation: w.translation,
              exampleSentence: w.exampleSentence || "",
            })),
          },
          // Builder-specific data for the relational models
          builderData: hasBuilderContent ? builderData : undefined,
          isPublished: settings.isPublished,
          isMarketplace: false,
          price: 0,
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
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 rounded-xl hover:bg-border/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-txt-secondary" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-2xl text-txt">Available {catMeta.title} Games</h1>
            <p className="text-sm text-txt-secondary">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 rounded-xl hover:bg-border/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-txt-secondary" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentGameType?.emoji}</span>
            <div>
              <h1 className="font-heading font-bold text-2xl text-txt">{currentGameType?.title}</h1>
              <p className="text-sm text-txt-secondary">{currentGameType?.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBuilderPreview(true)}
            disabled={previewItems.length < 2}
          >
            <PlayCircle className="w-4 h-4" /> Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Create Game"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Left: Word Bank */}
        <div className="lg:sticky lg:top-24 self-start h-[calc(100vh-180px)]">
          <WordBank
            words={wordBankWords}
            onWordsChange={setWordBankWords}
            contentType={currentGameType?.vocabContentType ?? "words"}
            existingSets={existingSets}
            language={language}
            level={level}
            onLanguageChange={setLanguage}
            onLevelChange={setLevel}
          />
        </div>

        {/* Right: Builder Workspace + Settings */}
        <div className="space-y-4 min-w-0">
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
                {(() => {
                  const Builder = currentGameType ? getBuilderForGameType(currentGameType.type) : null;
                  if (!Builder || !currentGameType) return null;
                  return (
                    <Builder
                      gameMeta={currentGameType}
                      onChange={setBuilderData}
                      initial={undefined}
                      onValidation={setBuilderValid}
                      wordBank={wordBankWords}
                      onWordBankChange={setWordBankWords}
                    />
                  );
                })()}
              </Suspense>
            </div>
          </div>

          {/* Settings - collapsible panel */}
          <SettingsPanel settings={settings} setSettings={setSettings} currentGameType={currentGameType} />

          {/* Bottom save */}
          <div className="flex items-center gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setShowBuilderPreview(true)}
              disabled={previewItems.length < 2}
            >
              <PlayCircle className="w-4 h-4" /> Preview Game
            </Button>
            <Button onClick={handleSave} disabled={saving}>
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
          customItems={previewItems as any}
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
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col md:flex-row gap-5 p-5 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
      {/* Visual area — game screenshot */}
      <GamePreviewImage
        type={game.type}
        title={game.title}
        className="md:w-52 flex-shrink-0 rounded-xl"
      />

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-semibold text-base text-txt">{game.title}</h3>
          {game.popular && (
            <span className="bg-primary/10 text-primary text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
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

        {/* Actions */}
        <div className="mt-auto flex items-center gap-3">
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-primary text-sm font-medium hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview Game
          </button>
          <button
            onClick={onSelect}
            className="ml-auto bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:bg-primary-dark transition-all flex items-center gap-2"
          >
            Select and Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
