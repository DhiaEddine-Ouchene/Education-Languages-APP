import React from "react";
import type { GameTypeMeta } from "@/lib/game-type-metadata";
import type { ChipData } from "./DraggableChip";

export type BuilderProps = {
  onChange: (data: Record<string, unknown>) => void;
  initial?: Record<string, unknown>;
  onValidation?: (isValid: boolean) => void;
  gameMeta: GameTypeMeta;
  wordBank: ChipData[];
  onWordBankChange?: (words: ChipData[]) => void;
  generating?: boolean;
};

export type BuilderComponent = React.ComponentType<BuilderProps>;

// Lazy-load builders
const FlashcardPairBuilder = React.lazy(() => import("./FlashcardPairBuilder").then(m => ({ default: m.FlashcardPairBuilder })));
const QuizQuestionBuilder = React.lazy(() => import("./QuizQuestionBuilder").then(m => ({ default: m.QuizQuestionBuilder })));
const CrosswordGridBuilder = React.lazy(() => import("./CrosswordGridBuilder").then(m => ({ default: m.CrosswordGridBuilder })));
const VerbConjugationBuilder = React.lazy(() => import("./VerbConjugationBuilder").then(m => ({ default: m.VerbConjugationBuilder })));
const StoryPromptBuilder = React.lazy(() => import("./StoryPromptBuilder").then(m => ({ default: m.StoryPromptBuilder })));
const SentenceFillBuilder = React.lazy(() => import("./SentenceFillBuilder").then(m => ({ default: m.SentenceFillBuilder })));
const SynonymAntonymBuilder = React.lazy(() => import("./SynonymAntonymBuilder").then(m => ({ default: m.SynonymAntonymBuilder })));
const OddOneOutBuilder = React.lazy(() => import("./OddOneOutBuilder").then(m => ({ default: m.OddOneOutBuilder })));

// Games that use the standard word-pair builder (word + translation)
export const PAIR_BUILDER_TYPES = [
  "FLASHCARD", "WORD_SCRAMBLE", "PICTURE_TO_WORD",
  "COLLOCATION_BUILDER", "FLASHCARD_3D", "MEMORY",
  "WORD_MEANING_MATCH", "MINIMAL_PAIR", "SPEED_ROUND",
];

// Games that use the sentence-fill builder (sentence + correctAnswer + options)
export const SENTENCE_FILL_BUILDER_TYPES = [
  "FILL_GAP_WORD", "FILL_BLANK", "FILL_BLANK_GRAMMAR",
  "DRAG_DROP", "SITUATION_DIALOGUE_FILL", "SENTENCE_BUILDER",
  "LISTEN_FILL_WORD", "LISTEN_FILL_SENTENCE",
  "SPEAK_FILL_WORD", "SPEAK_FILL_SENTENCE",
  "DICTATION",
];

// Games that use the quiz/Q&A builder
export const QUIZ_BUILDER_TYPES = ["QUIZ", "MULTIPLE_CHOICE_GRAMMAR", "ERROR_SPOTTING", "WORD_IN_CONTEXT"];

export const BUILDER_REGISTRY: Record<string, BuilderComponent> = {
  ...Object.fromEntries(PAIR_BUILDER_TYPES.map((t) => [t, FlashcardPairBuilder])),
  ...Object.fromEntries(SENTENCE_FILL_BUILDER_TYPES.map((t) => [t, SentenceFillBuilder])),
  ...Object.fromEntries(QUIZ_BUILDER_TYPES.map((t) => [t, QuizQuestionBuilder])),
  CROSSWORD: CrosswordGridBuilder,
  VERB_CONJUGATION: VerbConjugationBuilder,
  STORY: StoryPromptBuilder,
  SYNONYM_ANTONYM: SynonymAntonymBuilder,
  ODD_ONE_OUT: OddOneOutBuilder,
};

export function getBuilderForGameType(type: string): BuilderComponent | null {
  return BUILDER_REGISTRY[type] ?? null;
}
