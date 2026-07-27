"use client";

import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  Star,
  Clock,
  ChevronRight,
  X,
  Headphones,
  PenTool,
  FileText,
  Loader2,
  Zap,
  Check,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export type GameCategoryKey = "vocabulary" | "grammar" | "listening" | "writing";

export interface GameDefinition {
  id: string;
  type: string;
  title: string;
  desc: string;
  diff: number; // 1-3 stars
  time: string; // e.g. "10 mins"
  anex: "VOCABULARY" | "GRAMMAR" | "LISTENING_WRITING" | "SPEAKING";
  popular?: boolean;
}

export const CATEGORIES: Record<
  GameCategoryKey,
  {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    items: GameDefinition[];
  }
> = {
  vocabulary: {
    title: "Vocabulary Games",
    subtitle: "Spelling, synonyms, and word meanings.",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-800",
    items: [
      {
        id: "word_meaning_match",
        type: "WORD_MEANING_MATCH",
        title: "Word & Definition Match",
        desc: "Drag and drop definitions to their matching vocabulary words.",
        diff: 1,
        time: "10 mins",
        anex: "VOCABULARY",
        popular: true,
      },
      {
        id: "odd_one_out",
        type: "ODD_ONE_OUT",
        title: "Odd One Out",
        desc: "Identify which word doesn't belong in the semantic group.",
        diff: 2,
        time: "15 mins",
        anex: "VOCABULARY",
        popular: true,
      },
      {
        id: "synonym_antonym",
        type: "SYNONYM_ANTONYM",
        title: "Synonym & Antonym Race",
        desc: "Match words with their correct synonyms and antonyms before timer runs out.",
        diff: 3,
        time: "5 mins",
        anex: "VOCABULARY",
      },
      {
        id: "word_scramble",
        type: "WORD_SCRAMBLE",
        title: "Word Scramble",
        desc: "Unscramble letters to spell out target lesson vocabulary.",
        diff: 1,
        time: "8 mins",
        anex: "VOCABULARY",
      },
      {
        id: "fill_gap_word",
        type: "FILL_GAP_WORD",
        title: "Contextual Gap Fill",
        desc: "Fill in blank target words in example sentences.",
        diff: 2,
        time: "10 mins",
        anex: "VOCABULARY",
      },
      {
        id: "picture_to_word",
        type: "PICTURE_TO_WORD",
        title: "Picture to Word Match",
        desc: "Match vocabulary words with corresponding images.",
        diff: 1,
        time: "8 mins",
        anex: "VOCABULARY",
      },
      {
        id: "vocab_crossword",
        type: "CROSSWORD",
        title: "Vocabulary Crossword",
        desc: "Solve a crossword puzzle using clues from your vocabulary list.",
        diff: 3,
        time: "20 mins",
        anex: "VOCABULARY",
      },
    ],
  },
  grammar: {
    title: "Grammar Mastery",
    subtitle: "Tenses, sentence structure, and punctuation.",
    icon: FileText,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    items: [
      {
        id: "verb_conjugation",
        type: "VERB_CONJUGATION",
        title: "Tense & Conjugation Transformer",
        desc: "Change sentences from present to past/future tense in interactive tables.",
        diff: 2,
        time: "12 mins",
        anex: "GRAMMAR",
        popular: true,
      },
      {
        id: "error_spotting",
        type: "ERROR_SPOTTING",
        title: "Grammar Error Spotter",
        desc: "Spot and correct punctuation and syntax errors in complex sentences.",
        diff: 1,
        time: "8 mins",
        anex: "GRAMMAR",
      },
      {
        id: "sentence_builder",
        type: "SENTENCE_BUILDER",
        title: "Sentence Construction Builder",
        desc: "Rearrange scrambled phrases to construct valid sentences.",
        diff: 2,
        time: "10 mins",
        anex: "GRAMMAR",
        popular: true,
      },
      {
        id: "multiple_choice_grammar",
        type: "MULTIPLE_CHOICE_GRAMMAR",
        title: "Grammar Rule Quiz",
        desc: "Multiple choice questions testing rule application and word forms.",
        diff: 1,
        time: "5 mins",
        anex: "GRAMMAR",
      },
    ],
  },
  listening: {
    title: "Listening Skills",
    subtitle: "Phonetics, comprehension, and dictation.",
    icon: Headphones,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
    items: [
      {
        id: "dictation",
        type: "DICTATION",
        title: "Dictation Challenge",
        desc: "Listen to audio clips and type exactly what you hear.",
        diff: 3,
        time: "20 mins",
        anex: "LISTENING_WRITING",
        popular: true,
      },
      {
        id: "listen_fill_word",
        type: "LISTEN_FILL_WORD",
        title: "Listen & Fill Gap",
        desc: "Listen to sentence audio and type or select missing keywords.",
        diff: 2,
        time: "10 mins",
        anex: "LISTENING_WRITING",
      },
      {
        id: "listen_fill_sentence",
        type: "LISTEN_FILL_SENTENCE",
        title: "Audio Sentence Match",
        desc: "Listen to spoken clips and select matching written sentences.",
        diff: 1,
        time: "8 mins",
        anex: "LISTENING_WRITING",
      },
      {
        id: "minimal_pair",
        type: "MINIMAL_PAIR",
        title: "Minimal Pair Match",
        desc: "Distinguish between similar-sounding words by matching minimal pairs.",
        diff: 3,
        time: "15 mins",
        anex: "LISTENING_WRITING",
      },
      {
        id: "listen_select",
        type: "SPEED_ROUND",
        title: "Listen & Select",
        desc: "Listen to an audio clip and select the correct answer quickly.",
        diff: 1,
        time: "8 mins",
        anex: "LISTENING_WRITING",
      },
    ],
  },
  writing: {
    title: "Creative Writing",
    subtitle: "Creative prompts, essays, and reports.",
    icon: PenTool,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200 dark:border-rose-800",
    items: [
      {
        id: "story_builder",
        type: "STORY",
        title: "Story Builder",
        desc: "Interactive story completion using lesson vocabulary and grammar points.",
        diff: 2,
        time: "25 mins",
        anex: "LISTENING_WRITING",
        popular: true,
      },
      {
        id: "situation_dialogue_fill",
        type: "SITUATION_DIALOGUE_FILL",
        title: "Situational Dialogue",
        desc: "Complete real-world conversation dialogues based on context.",
        diff: 2,
        time: "15 mins",
        anex: "LISTENING_WRITING",
      },
      {
        id: "word_in_context",
        type: "WORD_IN_CONTEXT",
        title: "Sentence Expansion & Context",
        desc: "Write sentences incorporating lesson words in original context.",
        diff: 3,
        time: "15 mins",
        anex: "LISTENING_WRITING",
      },
    ],
  },
};

interface GameSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId?: string;
  lessonTitle?: string;
  lessonContent?: string;
  onGamesSelected?: (selectedGames: GameDefinition[]) => void;
}

export function GameSelectionModal({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  lessonContent,
  onGamesSelected,
}: GameSelectionModalProps) {
  const [activeCategory, setActiveCategory] = useState<GameCategoryKey>("vocabulary");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Choose Category, 2: Select Game, 3: Confirm

  if (!isOpen) return null;

  const currentCategoryData = CATEGORIES[activeCategory];

  const toggleGameSelection = (gameType: string) => {
    setSelectedGames((prev) =>
      prev.includes(gameType) ? prev.filter((g) => g !== gameType) : [...prev, gameType]
    );
  };

  const getFilteredItems = () => {
    return currentCategoryData.items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiff =
        difficultyFilter === "all" || item.diff.toString() === difficultyFilter;
      return matchesSearch && matchesDiff;
    });
  };

  const handleGenerateOrAttach = async () => {
    if (selectedGames.length === 0) {
      toast("error", "Please select at least one game type");
      return;
    }

    setGenerating(true);
    try {
      if (lessonId) {
        // Generate exercises via API
        const anexMap: Record<GameCategoryKey, "VOCABULARY" | "GRAMMAR" | "LISTENING_WRITING" | "SPEAKING"> = {
          vocabulary: "VOCABULARY",
          grammar: "GRAMMAR",
          listening: "LISTENING_WRITING",
          writing: "LISTENING_WRITING",
        };

        const anex = anexMap[activeCategory];
        const res = await fetch(`/api/lessons/${lessonId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anex }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to generate games");
        }

        toast("success", `Generated games for lesson: ${lessonTitle || "Lesson"}`);
      }

      // Notify parent of selected games
      const selectedDefs: GameDefinition[] = [];
      Object.values(CATEGORIES).forEach((cat) => {
        cat.items.forEach((item) => {
          if (selectedGames.includes(item.type)) {
            selectedDefs.push(item);
          }
        });
      });

      if (onGamesSelected) {
        onGamesSelected(selectedDefs);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      toast("error", err.message || "Failed to process game selection");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header with Wizard Stepper (from ChoseGame.html) */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                  Teacher Game Selection Wizard
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lessonTitle ? `Generating interactive games for: "${lessonTitle}"` : "Choose games to generate and attach to your course"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper bar from ChoseGame.html */}
          <div className="flex items-center justify-between max-w-xl mx-auto w-full relative px-4">
            <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0"></div>
            
            {/* Step 1 */}
            <button
              onClick={() => setCurrentStep(1)}
              className="flex flex-col items-center gap-1.5 z-10 relative bg-slate-50 dark:bg-slate-900 px-3 cursor-pointer group"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${
                  currentStep === 1
                    ? "bg-primary text-white ring-4 ring-primary/20 scale-110"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <span
                className={`text-xs font-semibold ${
                  currentStep === 1 ? "text-primary" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Category
              </span>
            </button>

            {/* Step 2 */}
            <button
              onClick={() => setCurrentStep(2)}
              className="flex flex-col items-center gap-1.5 z-10 relative bg-slate-50 dark:bg-slate-900 px-3 cursor-pointer group"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${
                  currentStep === 2
                    ? "bg-primary text-white ring-4 ring-primary/20 scale-110"
                    : selectedGames.length > 0
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                2
              </div>
              <span
                className={`text-xs font-semibold ${
                  currentStep === 2 ? "text-primary" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Select Games ({selectedGames.length})
              </span>
            </button>

            {/* Step 3 */}
            <button
              onClick={() => setCurrentStep(3)}
              className="flex flex-col items-center gap-1.5 z-10 relative bg-slate-50 dark:bg-slate-900 px-3 cursor-pointer group"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${
                  currentStep === 3
                    ? "bg-primary text-white ring-4 ring-primary/20 scale-110"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                3
              </div>
              <span
                className={`text-xs font-semibold ${
                  currentStep === 3 ? "text-primary" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Generate & Attach
              </span>
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Grid Section */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Categories Grid */}
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                  Select Game Skill Area
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pick a skill category to browse available classroom activities.
                </p>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search games by name..."
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="relative min-w-[160px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="1">Beginner (1 Star)</option>
                    <option value="2">Intermediate (2 Stars)</option>
                    <option value="3">Advanced (3 Stars)</option>
                  </select>
                </div>
              </div>

              {/* Category Selection Cards Grid (Exact design from ChoseGame.html) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.keys(CATEGORIES) as GameCategoryKey[]).map((key) => {
                  const cat = CATEGORIES[key];
                  const IconComponent = cat.icon;
                  const isActive = activeCategory === key;
                  const countInCat = cat.items.filter((i) => selectedGames.includes(i.type)).length;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveCategory(key);
                        setCurrentStep(2);
                      }}
                      className={`text-left p-6 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between group cursor-pointer ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/30"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg"
                      }`}
                    >
                      {countInCat > 0 && (
                        <span className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                          {countInCat} Selected
                        </span>
                      )}
                      <div className="space-y-4">
                        <div
                          className={`w-14 h-14 rounded-2xl ${cat.bgColor} flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform duration-300`}
                        >
                          <IconComponent className="h-7 w-7" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-1">
                            {cat.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {cat.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                        Explore Games <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side Panel: Games List for Active Category (From ChoseGame.html side panel) */}
            <aside className="w-full lg:w-[420px] shrink-0 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[580px]">
              <div className="p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h4 className="font-bold font-heading text-slate-900 dark:text-white">
                    {currentCategoryData.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {getFilteredItems().length} games available
                  </p>
                </div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {activeCategory}
                </span>
              </div>

              {/* Game Cards List */}
              <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {getFilteredItems().map((game) => {
                  const isSelected = selectedGames.includes(game.type);

                  return (
                    <div
                      key={game.id}
                      onClick={() => toggleGameSelection(game.type)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                        isSelected
                          ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-1 ring-primary"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      {game.popular && (
                        <span className="absolute top-3 right-3 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Popular
                        </span>
                      )}
                      <div className="flex justify-between items-start mb-2 pr-16">
                        <h5 className="font-bold font-heading text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                          {game.title}
                        </h5>
                      </div>

                      {/* Difficulty stars */}
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= game.diff
                                ? "text-amber-500 fill-amber-500"
                                : "text-slate-300 dark:text-slate-700"
                            }`}
                          />
                        ))}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-snug">
                        {game.desc}
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {game.time}
                        </span>
                        <Button
                          size="sm"
                          variant={isSelected ? "primary" : "outline"}
                          className="rounded-full text-xs font-bold h-8 px-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGameSelection(game.type);
                          }}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Selected
                            </>
                          ) : (
                            "Select Game"
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {getFilteredItems().length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No games matching search filters.
                  </div>
                )}
              </div>

              {/* Bottom selection summary */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">
                  {selectedGames.length} game(s) chosen
                </span>
                {selectedGames.length > 0 && (
                  <button
                    onClick={() => setSelectedGames([])}
                    className="text-xs text-rose-500 font-semibold hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Zap className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              Selected games will be automatically populated with target vocabulary and grammar rules from the lesson.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateOrAttach}
              disabled={generating || selectedGames.length === 0}
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Games...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate & Attach {selectedGames.length} Game(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
