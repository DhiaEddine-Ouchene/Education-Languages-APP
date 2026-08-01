// ── Adapts AI-generated per-game-type content into player-ready items ──
// The game pages previously never looked at the rich generated data; they only
// used the plain vocabulary list (word/translation). This adapter normalizes
// either source into GameItem[] with the game-type-specific fields available.

import type { GameItem } from "@/components/games/types";

type VocabItem = {
  id: string;
  word: string;
  translation: string;
  audioUrl: string | null;
  imageUrl: string | null;
  exampleSentence: string | null;
};

function withId(index: number, fields: Partial<GameItem>): GameItem {
  return {
    id: `gen-${index}`,
    word: "",
    translation: "",
    audioUrl: null,
    imageUrl: null,
    exampleSentence: null,
    ...fields,
  };
}

export function adaptGeneratedGame(
  gameType: string,
  generated: unknown,
  fallback: VocabItem[]
): GameItem[] {
  const items = (generated as any)?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return fallback.map((i) => ({ ...i }));
  }

  switch (gameType) {
    case "FLASHCARD":
    case "MEMORY":
    case "FLASHCARD_3D":
    case "WORD_MEANING_MATCH":
      return items.map((it: any, i: number) =>
        withId(i, { word: it.word, translation: it.translation, exampleSentence: it.exampleSentence ?? null })
      );

    case "WORD_SCRAMBLE":
      return items.map((it: any, i: number) =>
        withId(i, { word: it.word, hint: it.hint, translation: it.hint })
      );

    case "SYNONYM_ANTONYM":
      return items.map((it: any, i: number) =>
        withId(i, { word: it.word, synonym: it.synonym, antonym: it.antonym, distractors: it.distractors, translation: it.synonym })
      );

    case "ODD_ONE_OUT":
      return items.map((it: any, i: number) =>
        withId(i, { words: it.words, oddWord: it.oddWord, category: it.category, word: it.category })
      );

    case "PICTURE_TO_WORD":
      return items.map((it: any, i: number) =>
        withId(i, { word: it.word, imageSearchTerm: it.imageSearchTerm, distractors: it.distractors })
      );

    case "COLLOCATION_BUILDER":
      return items.map((it: any, i: number) =>
        withId(i, { baseWord: it.baseWord, word: it.baseWord, correctPartners: it.correctPartners, wrongPartners: it.wrongPartners })
      );

    case "MINIMAL_PAIR":
      return items.map((it: any, i: number) =>
        withId(i, { wordA: it.wordA, wordB: it.wordB, word: it.wordA, translation: it.wordB })
      );

    case "SPEED_ROUND":
      return items.map((it: any, i: number) =>
        withId(i, { word: it.word, distractors: it.distractors })
      );

    case "SITUATION_DIALOGUE_FILL":
      return items.map((it: any, i: number) =>
        withId(i, { scenario: it.scenario, lines: it.lines, blanks: it.blanks })
      );

    case "WORD_IN_CONTEXT":
      return items.map((it: any, i: number) =>
        withId(i, { word: it.word, correctSentence: it.correctSentence, incorrectSentences: it.incorrectSentences })
      );

    case "SENTENCE_BUILDER":
      return items.map((it: any, i: number) =>
        withId(i, { correctSentence: it.correctSentence, word: it.correctSentence })
      );

    case "ERROR_SPOTTING":
      return items.map((it: any, i: number) =>
        withId(i, { sentenceWithError: it.sentenceWithError, wrongPart: it.wrongPart, correction: it.correction, ruleExplanation: it.ruleExplanation, word: it.sentenceWithError, translation: it.correction })
      );

    case "FILL_BLANK_GRAMMAR":
      return items.map((it: any, i: number) =>
        withId(i, { sentenceWithBlank: it.sentenceWithBlank, baseVerbForm: it.baseVerbForm, correctConjugatedForm: it.correctConjugatedForm, word: it.sentenceWithBlank, translation: it.correctConjugatedForm })
      );

    case "VERB_CONJUGATION":
      return items.map((it: any, i: number) =>
        withId(i, { verb: it.verb, tense: it.tense, forms: it.forms, word: it.verb, translation: it.tense })
      );

    case "MULTIPLE_CHOICE_GRAMMAR":
    case "QUIZ":
      return items.map((it: any, i: number) =>
        withId(i, { question: it.question, options: it.options, correctOption: it.correctOption, explanation: it.explanation, word: it.question, translation: it.correctOption })
      );

    case "DRAG_DROP":
      return items.map((it: any, i: number) =>
        withId(i, { dragItems: it.items, dragCategories: it.categories, correctMapping: it.correctMapping })
      );

    case "STORY":
      return items.map((it: any, i: number) =>
        withId(i, { writingPrompt: it.writingPrompt, wordBank: it.wordBank, word: it.writingPrompt })
      );

    case "FILL_BLANK":
    case "FILL_GAP_WORD":
    case "LISTEN_FILL_WORD":
    case "SPEAK_FILL_WORD":
      return items.map((it: any, i: number) =>
        withId(i, { sentenceWithBlank: it.sentenceWithBlank, correctWord: it.correctWord, word: it.sentenceWithBlank, translation: it.correctWord })
      );

    case "DICTATION":
    case "LISTEN_FILL_SENTENCE":
    case "SPEAK_FILL_SENTENCE":
      return items.map((it: any, i: number) =>
        withId(i, { sentence: it.sentence, word: it.sentence })
      );

    case "CROSSWORD":
      return items.map((it: any, i: number) =>
        withId(i, { word: it.word, clue: it.clue, translation: it.clue })
      );

    default:
      return fallback.map((i) => ({ ...i }));
  }
}

/**
 * Builds player-ready items for the ported-engine game types whose rich content
 * lives in `game.settings` (rather than a vocabulary set). Falls back to the
 * existing generated/vocab path for all other types.
 */
export function adaptPlayItems(
  gameType: string,
  settings: Record<string, any>,
  fallback: VocabItem[]
): GameItem[] {
  const s = settings || {};
  switch (gameType) {
    case "CATEGORY_SORT": {
      const sortItems = s.sortItems || [];
      return sortItems.length
        ? [withId(0, { word: "Sort", sortCategories: s.sortCategories || [], sortItems }) ]
        : fallback.map((i) => ({ ...i }));
    }
    case "TRANSFORMATION": {
      const t = s.transformationItems || [];
      return t.length
        ? t.map((it: any, i: number) =>
            withId(i, { taskPrompt: it.prompt, instruction: it.instruction, answers: it.answers, word: it.prompt })
          )
        : fallback.map((i) => ({ ...i }));
    }
    case "WRITING_RUBRIC": {
      const w = s.writingData || {};
      return w.prompt
        ? [withId(0, { writingPrompt: w.prompt, wordBank: w.wordBank, starter: w.starter, note: w.note, teacherReview: w.teacherReview, rubric: w.rules, word: w.prompt })]
        : fallback.map((i) => ({ ...i }));
    }
    case "SPEAKING": {
      const sp = s.speakingItems || [];
      return sp.length
        ? sp.map((it: any, i: number) =>
            withId(i, { word: it.display || it.target || "", mode: it.mode, display: it.display, target: it.target, keywords: it.keywords, note: it.note, task: it.task, audioText: it.audioText })
          )
        : fallback.map((i) => ({ ...i }));
    }
    default:
      return fallback.map((i) => ({ ...i }));
  }
}
