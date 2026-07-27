"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, BookOpen, PenTool, Headphones, Edit3 } from "lucide-react";

export type GameCategory = "vocabulary" | "grammar" | "listening" | "writing";

export type GameTemplate = {
  id: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;
  timeEstimate: string;
  type: string;
};

const CATEGORIES: Record<GameCategory, { title: string; desc: string; icon: any; color: string; bg: string }> = {
  vocabulary: {
    title: "Vocabulary",
    desc: "Spelling, synonyms, and word meanings.",
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  grammar: {
    title: "Grammar",
    desc: "Tenses, sentence structure, and punctuation.",
    icon: PenTool,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  listening: {
    title: "Listening",
    desc: "Phonetics, comprehension, and dictation.",
    icon: Headphones,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  writing: {
    title: "Writing",
    desc: "Creative prompts, essays, and reports.",
    icon: Edit3,
    color: "text-red-600",
    bg: "bg-red-100",
  },
};

const GAMES_DATA: Record<GameCategory, GameTemplate[]> = {
  vocabulary: [
    { id: "vocab_synonym", type: "SYNONYM_ANTONYM", title: "Synonym & Antonym Match", description: "Match words with their synonyms and antonyms to build word associations.", difficulty: 1, timeEstimate: "10 mins" },
    { id: "vocab_fill", type: "FILL_GAP_WORD", title: "Fill the Gap", description: "Complete sentences by filling in the missing vocabulary word.", difficulty: 2, timeEstimate: "12 mins" },
    { id: "vocab_meaning", type: "WORD_MEANING_MATCH", title: "Word & Meaning Match", description: "Drag and drop definitions to their matching vocabulary words.", difficulty: 1, timeEstimate: "10 mins" },
    { id: "vocab_dialogue", type: "SITUATION_DIALOGUE_FILL", title: "Situational Dialogue", description: "Fill in missing words in realistic dialogue scenarios.", difficulty: 3, timeEstimate: "15 mins" },
    { id: "vocab_context", type: "WORD_IN_CONTEXT", title: "Word in Context", description: "Choose the correct word that fits the context of the sentence.", difficulty: 2, timeEstimate: "10 mins" },
    { id: "vocab_scramble", type: "WORD_SCRAMBLE", title: "Word Scramble", description: "Unscramble jumbled letters to form the correct vocabulary word.", difficulty: 1, timeEstimate: "8 mins" },
    { id: "vocab_odd", type: "ODD_ONE_OUT", title: "Odd One Out", description: "Identify which word doesn't belong in the semantic group.", difficulty: 2, timeEstimate: "10 mins" },
    { id: "vocab_3d", type: "FLASHCARD_3D", title: "3D Word Matcher", description: "Match words with their translations in an interactive 3D card game.", difficulty: 1, timeEstimate: "8 mins" },
    { id: "vocab_collocation", type: "COLLOCATION_BUILDER", title: "Collocation Builder", description: "Build natural word combinations by matching collocations.", difficulty: 2, timeEstimate: "12 mins" },
    { id: "vocab_crossword", type: "CROSSWORD", title: "Vocabulary Crossword", description: "Solve a crossword puzzle using clues from your vocabulary list.", difficulty: 3, timeEstimate: "20 mins" },
  ],
  grammar: [
    { id: "gram_sentence", type: "SENTENCE_BUILDER", title: "Sentence Builder", description: "Assemble the correct sentence structure from scrambled words.", difficulty: 1, timeEstimate: "8 mins" },
    { id: "gram_error", type: "ERROR_SPOTTING", title: "Error Spotting", description: "Find and correct the grammar mistakes in the provided texts.", difficulty: 3, timeEstimate: "15 mins" },
    { id: "gram_fill", type: "FILL_BLANK_GRAMMAR", title: "Fill the Blank (Grammar)", description: "Complete sentences with the correct grammatical form.", difficulty: 2, timeEstimate: "10 mins" },
    { id: "gram_verb", type: "VERB_CONJUGATION", title: "Verb Conjugation", description: "Conjugate verbs correctly across different tenses and persons.", difficulty: 2, timeEstimate: "12 mins" },
    { id: "gram_mcq", type: "MULTIPLE_CHOICE_GRAMMAR", title: "Multiple Choice Grammar", description: "Choose the grammatically correct option from multiple choices.", difficulty: 1, timeEstimate: "8 mins" },
    { id: "gram_sv", type: "DRAG_DROP", title: "Subject-Verb Match", description: "Match subjects with their correct verb forms by dragging and dropping.", difficulty: 2, timeEstimate: "10 mins" },
    { id: "gram_tense", type: "QUIZ", title: "Tense Sorter", description: "Sort sentences into the correct tense categories.", difficulty: 2, timeEstimate: "12 mins" },
  ],
  listening: [
    { id: "list_dictation", type: "DICTATION", title: "Dictation Challenge", description: "Listen to audio clips and type exactly what you hear.", difficulty: 3, timeEstimate: "20 mins" },
    { id: "list_fill", type: "LISTEN_FILL_WORD", title: "Listen & Fill the Gap", description: "Listen to a sentence and fill in the missing word.", difficulty: 2, timeEstimate: "12 mins" },
    { id: "list_order", type: "LISTEN_FILL_SENTENCE", title: "Listen & Order", description: "Listen to a sentence and arrange the words in the correct order.", difficulty: 2, timeEstimate: "15 mins" },
    { id: "list_select", type: "SPEED_ROUND", title: "Listen & Select", description: "Listen to an audio clip and select the correct answer quickly.", difficulty: 1, timeEstimate: "8 mins" },
    { id: "list_pair", type: "MINIMAL_PAIR", title: "Minimal Pair Match", description: "Distinguish between similar-sounding words by matching minimal pairs.", difficulty: 3, timeEstimate: "15 mins" },
  ],
  writing: [
    { id: "write_paragraph", type: "STORY", title: "Guided Paragraph", description: "Write a structured paragraph following guided prompts and templates.", difficulty: 2, timeEstimate: "25 mins" },
    { id: "write_rewrite", type: "FILL_BLANK", title: "Rewrite & Correct", description: "Rewrite sentences to fix errors and improve clarity.", difficulty: 3, timeEstimate: "15 mins" },
    { id: "write_complete", type: "FILL_GAP_WORD", title: "Sentence Completion", description: "Complete partial sentences with appropriate words and phrases.", difficulty: 1, timeEstimate: "10 mins" },
    { id: "write_expand", type: "SPEAK_FILL_SENTENCE", title: "Sentence Expansion", description: "Expand simple sentences by adding adjectives, adverbs, and clauses.", difficulty: 2, timeEstimate: "12 mins" },
  ],
};

interface Props {
  onSelectGame: (category: GameCategory, template: GameTemplate) => void;
  mode?: "ai" | "manual";
}

export function GameTypeSelector({ onSelectGame, mode = "ai" }: Props) {
  const [activeCategory, setActiveCategory] = useState<GameCategory | null>(null);

  const actionLabel = mode === "ai" ? "Generate" : "Create";

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto">
      <div className="flex-grow space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-bold text-slate-900 mb-2">Select a Game Category</h2>
          <p className="text-slate-600 text-lg">
            {mode === "ai"
              ? "Choose a skill area to see available AI-generated classroom activities."
              : "Choose a skill area and game type to create manually."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.entries(CATEGORIES) as [GameCategory, typeof CATEGORIES[GameCategory]][]).map(([key, cat]) => {
            const isActive = activeCategory === key;
            const Icon = cat.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "group p-6 rounded-2xl border text-left flex flex-col items-start gap-4 transition-all duration-300",
                  isActive 
                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                    : "border-slate-200 bg-white hover:border-primary/40 hover:shadow-sm hover:-translate-y-1"
                )}
              >
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", cat.bg, cat.color)}>
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">{cat.title}</h3>
                  <p className="text-slate-600 text-sm">{cat.desc}</p>
                </div>
                <div className="mt-auto flex items-center text-primary font-bold text-sm group-hover:gap-2 transition-all">
                  View Games <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeCategory && (
        <aside className="w-full lg:w-[420px] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-lg flex flex-col overflow-hidden max-h-[750px] animate-in slide-in-from-right-8 duration-500">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-heading text-xl font-bold text-slate-900">{CATEGORIES[activeCategory].title} Games</h3>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {GAMES_DATA[activeCategory].length} Games
            </span>
          </div>
          
          <div className="flex-grow overflow-y-auto p-5 space-y-4">
            {GAMES_DATA[activeCategory].map((game) => (
              <div 
                key={game.id} 
                className="p-5 rounded-xl border border-slate-200 bg-white hover:border-primary hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-heading text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {game.title}
                  </h4>
                </div>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">{game.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Time: {game.timeEstimate}</span>
                  <button 
                    onClick={() => onSelectGame(activeCategory, game)}
                    className="bg-primary text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-primary/90 hover:scale-105 transition-all shadow-sm"
                  >
                    {actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
