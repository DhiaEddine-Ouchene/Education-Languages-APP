// ── Centralized Game Schema Registry ──
// Each game type has a Zod schema + prompt template for AI generation.
// All bilingual content fields use _target (required) / _native (optional) pairs.

import { z } from "zod";

// ── Bilingual Field Helpers ──
const targetNative = (label: string) => ({
  [`${label}_target`]: z.string().min(1),
  [`${label}_native`]: z.string().optional(),
});

const wordPairItem = z.object({
  ...targetNative("word"),
  ...targetNative("exampleSentence"),
});
type WordPairItem = z.infer<typeof wordPairItem>;

const sentenceFillItem = z.object({
  ...targetNative("sentence"),
  blankPosition: z.number().int().optional(),
  options: z.array(z.string()).min(2).optional(),
  correctAnswer: z.string().min(1),
});
type SentenceFillItem = z.infer<typeof sentenceFillItem>;

const quizQuestionItem = z.object({
  ...targetNative("prompt"),
  options: z.array(z.object({
    ...targetNative("option"),
  })).min(2).max(6),
  correctAnswer: z.string().min(1),
  ...targetNative("explanation"),
});
type QuizQuestionItem = z.infer<typeof quizQuestionItem>;

const audioResponseItem = z.object({
  audioPrompt: z.string().min(1),
  ...targetNative("expectedResponse"),
  hints: z.array(z.string()).optional(),
});
type AudioResponseItem = z.infer<typeof audioResponseItem>;

const crosswordWordItem = z.object({
  ...targetNative("word"),
  ...targetNative("clue"),
  direction: z.enum(["across", "down"]),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});
type CrosswordWordItem = z.infer<typeof crosswordWordItem>;

const verbConjugationForm = z.object({
  pronoun: z.string().min(1),
  form_target: z.string().min(1),
  form_native: z.string().optional(),
});

const storyDataItem = z.object({
  ...targetNative("prompt"),
  wordBank: z.array(z.string()).optional(),
  ...targetNative("template"),
});

// ── Per-Game-Type Schemas ──

const WORD_PAIR_SCHEMA = z.object({ items: z.array(wordPairItem).min(2).max(50) });
const SENTENCE_FILL_SCHEMA = z.object({ items: z.array(sentenceFillItem).min(2).max(50) });
const QUIZ_QUESTION_SCHEMA = z.object({ items: z.array(quizQuestionItem).min(1).max(50) });
const AUDIO_RESPONSE_SCHEMA = z.object({ items: z.array(audioResponseItem).min(2).max(50) });
const CROSSWORD_SCHEMA = z.object({
  gridSize: z.number().int().min(6).max(12).default(8),
  words: z.array(crosswordWordItem).min(2).max(20),
});
const VERB_CONJUGATION_SCHEMA = z.object({
  verb: z.string().min(1),
  tense: z.string().min(1),
  forms: z.array(verbConjugationForm).min(2).max(20),
});
const STORY_SCHEMA = z.object({
  ...targetNative("prompt"),
  wordBank: z.array(z.string()).optional(),
  ...targetNative("template"),
});

// ── Prompt Template Builder ──

type PromptBuilder = (params: {
  sourceContent: string;
  count: number;
  targetLang: string;
  nativeLang: string;
  existingItems?: any[];
}) => string;

function wordPairPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]): string {
  return `You are generating vocabulary game content from the following source material.

Source material: """${sourceContent}"""

Generate exactly ${count} word pairs for a vocabulary game. Each pair must follow this structure:
- word_target: the word or phrase in ${targetLang}
- word_native: the translation in ${nativeLang}
- exampleSentence_target: a natural example sentence using the word in ${targetLang}
- exampleSentence_native: the example sentence translated into ${nativeLang} (optional but recommended)

Respond with ONLY a JSON object: {"items": [{"word_target": "...", "word_native": "...", "exampleSentence_target": "...", "exampleSentence_native": "..."}]}`;
}

function sentenceFillPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]): string {
  return `You are generating sentence-fill exercises from the following source material.

Source material: """${sourceContent}"""

Generate exactly ${count} sentence-fill items. Each item:
- sentence_target: a sentence in ${targetLang} with "___" marking the blank
- sentence_native: the sentence translated into ${nativeLang} (optional)
- correctAnswer: the correct word or phrase to fill the blank
- options: 3-4 possible answer choices (including the correct one) in ${targetLang}

Respond with ONLY: {"items": [{"sentence_target": "...", "sentence_native": "...", "correctAnswer": "...", "options": ["...", "...", "..."]}]}`;
}

function quizQuestionPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]): string {
  return `You are generating quiz questions from the following source material.

Source material: """${sourceContent}"""

Generate exactly ${count} multiple-choice questions. Each question:
- prompt_target: the question in ${targetLang}
- prompt_native: the question in ${nativeLang} (optional)
- options: 4 choices, each with:
  - option_target: the choice text in ${targetLang}
  - option_native: the choice text in ${nativeLang} (optional)
- correctAnswer: the exact text of the correct option_target
- explanation_target: explanation in ${targetLang} (optional)
- explanation_native: explanation in ${nativeLang} (optional)

Respond with ONLY: {"items": [{"prompt_target": "...", "options": [...], "correctAnswer": "...", "explanation_target": "..."}]}`;
}

function audioResponsePrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]): string {
  return `You are generating audio-based exercises from the following source material.

Source material: """${sourceContent}"""

Generate exactly ${count} audio response items for ${targetLang} learners. Each item:
- audioPrompt: the text that should be read aloud to the student (in ${targetLang})
- expectedResponse_target: what the student should type or say (in ${targetLang})
- expectedResponse_native: translation of the expected response (optional)
- hints: 1-3 progressive hints to help the student

Respond with ONLY: {"items": [{"audioPrompt": "...", "expectedResponse_target": "...", "hints": ["...", "..."]}]}`;
}

function crosswordPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]): string {
  return `You are generating a crossword puzzle from the following source material.

Source material: """${sourceContent}"""

Generate exactly ${count} crossword words for ${targetLang} learners (native language: ${nativeLang}). Each word:
- word_target: the answer word in ${targetLang}
- word_native: translation of the word in ${nativeLang} (optional)
- clue_target: the clue in ${targetLang}
- clue_native: the clue in ${nativeLang} (optional)
- direction: "across" or "down"
- row: row position (0-based)
- col: column position (0-based)

Respond with ONLY: {"gridSize": 8, "words": [{"word_target": "...", "clue_target": "...", "direction": "across", "row": 0, "col": 0}]}`;
}

function verbConjugationPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]): string {
  const pronouns = ["I", "You", "He/She", "We", "They"];
  return `You are generating a verb conjugation exercise from the following source material.

Source material: """${sourceContent}"""

Generate 1 verb conjugation table. The target language is ${targetLang}.
- verb: the infinitive form in ${targetLang}
- tense: the tense name (e.g. "Present", "Past", "Future")
- forms: an array of ${pronouns.length} entries, one per pronoun:
  - pronoun: "${pronouns.join('", "')}"
  - form_target: the conjugated form in ${targetLang}
  - form_native: translation of the conjugated form (optional)

Respond with ONLY: {"verb": "...", "tense": "...", "forms": [{"pronoun": "I", "form_target": "..."}]}`;
}

function storyPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]): string {
  return `You are generating a creative writing exercise from the following source material.

Source material: """${sourceContent}"""

Generate a writing prompt for ${targetLang} learners (native language: ${nativeLang}).
- prompt_target: the writing prompt in ${targetLang}
- prompt_native: the writing prompt in ${nativeLang} (optional)
- wordBank: an array of 5-10 words in ${targetLang} that students should try to use in their writing
- template_target: a suggested story structure in ${targetLang} (optional)
- template_native: the structure in ${nativeLang} (optional)

Respond with ONLY: {"prompt_target": "...", "wordBank": ["...", "..."], "template_target": "..."}`;
}

// ── Schema Registry ──

export type GameSchemaConfig = {
  schema: z.ZodTypeAny;
  buildPrompt: PromptBuilder;
  bilingualFields: string[];
  description: string;
};

export const GAME_SCHEMAS: Record<string, GameSchemaConfig> = {
  // ── Word Pairs ──
  FLASHCARD: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Word-translation flashcard pairs" },
  SYNONYM_ANTONYM: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Synonym/antonym word pairs" },
  WORD_SCRAMBLE: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Word scramble puzzle items" },
  PICTURE_TO_WORD: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Picture-to-word matching items" },
  COLLOCATION_BUILDER: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Collocation pairs" },
  FLASHCARD_3D: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "3D word matching items" },
  ODD_ONE_OUT: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Odd-one-out word groups" },
  MEMORY: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Memory match pairs" },
  WORD_MEANING_MATCH: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Word-definition matching items" },
  MINIMAL_PAIR: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Minimal pair sound discrimination items" },
  SPEED_ROUND: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, bilingualFields: ["word", "exampleSentence"], description: "Speed round fast-recognition items" },

  // ── Sentence Fill ──
  FILL_BLANK: { schema: SENTENCE_FILL_SCHEMA, buildPrompt: sentenceFillPrompt, bilingualFields: ["sentence"], description: "Fill-the-blank sentence exercises" },
  FILL_GAP_WORD: { schema: SENTENCE_FILL_SCHEMA, buildPrompt: sentenceFillPrompt, bilingualFields: ["sentence"], description: "Word gap-fill exercises" },
  FILL_BLANK_GRAMMAR: { schema: SENTENCE_FILL_SCHEMA, buildPrompt: sentenceFillPrompt, bilingualFields: ["sentence"], description: "Grammar fill-the-blank exercises" },
  WORD_IN_CONTEXT: { schema: SENTENCE_FILL_SCHEMA, buildPrompt: sentenceFillPrompt, bilingualFields: ["sentence"], description: "Word-in-context exercises" },
  SITUATION_DIALOGUE_FILL: { schema: SENTENCE_FILL_SCHEMA, buildPrompt: sentenceFillPrompt, bilingualFields: ["sentence"], description: "Dialogue gap-fill exercises" },
  SENTENCE_BUILDER: { schema: SENTENCE_FILL_SCHEMA, buildPrompt: sentenceFillPrompt, bilingualFields: ["sentence"], description: "Word-ordering sentence exercises" },
  DRAG_DROP: { schema: SENTENCE_FILL_SCHEMA, buildPrompt: sentenceFillPrompt, bilingualFields: ["sentence"], description: "Drag-and-drop sentence matching" },

  // ── Quiz Questions ──
  QUIZ: { schema: QUIZ_QUESTION_SCHEMA, buildPrompt: quizQuestionPrompt, bilingualFields: ["prompt", "option", "explanation"], description: "Multiple-choice quiz questions" },
  MULTIPLE_CHOICE_GRAMMAR: { schema: QUIZ_QUESTION_SCHEMA, buildPrompt: quizQuestionPrompt, bilingualFields: ["prompt", "option", "explanation"], description: "Grammar multiple-choice questions" },
  ERROR_SPOTTING: { schema: QUIZ_QUESTION_SCHEMA, buildPrompt: quizQuestionPrompt, bilingualFields: ["prompt", "option", "explanation"], description: "Error-spotting grammar questions" },

  // ── Audio Response ──
  DICTATION: { schema: AUDIO_RESPONSE_SCHEMA, buildPrompt: audioResponsePrompt, bilingualFields: ["expectedResponse"], description: "Dictation exercises" },
  LISTEN_FILL_WORD: { schema: AUDIO_RESPONSE_SCHEMA, buildPrompt: audioResponsePrompt, bilingualFields: ["expectedResponse"], description: "Listen-and-fill-word exercises" },
  LISTEN_FILL_SENTENCE: { schema: AUDIO_RESPONSE_SCHEMA, buildPrompt: audioResponsePrompt, bilingualFields: ["expectedResponse"], description: "Listen-and-fill-sentence exercises" },
  SPEAK_FILL_WORD: { schema: AUDIO_RESPONSE_SCHEMA, buildPrompt: audioResponsePrompt, bilingualFields: ["expectedResponse"], description: "Speak-and-fill-word exercises" },
  SPEAK_FILL_SENTENCE: { schema: AUDIO_RESPONSE_SCHEMA, buildPrompt: audioResponsePrompt, bilingualFields: ["expectedResponse"], description: "Speak-and-fill-sentence exercises" },

  // ── Specialized ──
  CROSSWORD: { schema: CROSSWORD_SCHEMA, buildPrompt: crosswordPrompt, bilingualFields: ["word", "clue"], description: "Crossword puzzle" },
  VERB_CONJUGATION: { schema: VERB_CONJUGATION_SCHEMA, buildPrompt: verbConjugationPrompt, bilingualFields: ["form"], description: "Verb conjugation table" },
  STORY: { schema: STORY_SCHEMA, buildPrompt: storyPrompt, bilingualFields: ["prompt", "template"], description: "Creative writing prompt" },
};

export function getGameSchema(type: string): GameSchemaConfig | null {
  return GAME_SCHEMAS[type] ?? null;
}
