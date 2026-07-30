// ── Centralized Game Schema Registry ──
// Each game type has its OWN Zod schema + prompt template.
// Field names use simple names (word, translation, sentence) — NOT _target/_native suffixes.
// This matches what the AI naturally generates and what the builders expect.

import { z } from "zod";

type PromptBuilder = (params: {
  sourceContent: string;
  count: number;
  targetLang: string;
  nativeLang: string;
  existingItems?: any[];
}) => string;

export type GameSchemaConfig = {
  schema: z.ZodTypeAny;
  buildPrompt: PromptBuilder;
  description: string;
};

const header = (topic: string, sourceContent: string) =>
  `Source material / lesson topic: """${sourceContent}"""\n\nTask: ${topic}\n`;

const footer = (jsonExample: string) =>
  `\nRespond with ONLY valid JSON, no markdown fences, no commentary, matching exactly:\n${jsonExample}`;

// ═══════════════════════════════════════════════════════════
// VOCABULARY GAMES
// ═══════════════════════════════════════════════════════════

// FLASHCARD, MEMORY, FLASHCARD_3D — word, translation, example sentence
const wordPairItem = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  exampleSentence: z.string().min(1),
});
const WORD_PAIR_SCHEMA = z.object({ items: z.array(wordPairItem).min(2).max(50) });
function wordPairPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} vocabulary flashcards for a ${targetLang} learner (native language: ${nativeLang}).`, sourceContent) +
    `Each item needs:\n- word: the word/phrase in ${targetLang}\n- translation: its meaning in ${nativeLang}\n- exampleSentence: a natural sentence in ${targetLang} using the word\n` +
    footer(`{"items":[{"word":"...","translation":"...","exampleSentence":"..."}]}`);
}

// WORD_MEANING_MATCH — word + definition/translation
const wordMeaningItem = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  exampleSentence: z.string().optional(),
});
const WORD_MEANING_SCHEMA = z.object({ items: z.array(wordMeaningItem).min(2).max(50) });
function wordMeaningPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} word-and-meaning pairs for a ${targetLang} learner (native language: ${nativeLang}).`, sourceContent) +
    `Each item needs:\n- word: the word in ${targetLang}\n- translation: a clear definition or translation in ${nativeLang}\n- exampleSentence: optional short example sentence in ${targetLang}\n` +
    footer(`{"items":[{"word":"...","translation":"...","exampleSentence":"..."}]}`);
}

// WORD_SCRAMBLE — word + hint
const wordScrambleItem = z.object({
  word: z.string().min(2),
  hint: z.string().min(1),
});
const WORD_SCRAMBLE_SCHEMA = z.object({ items: z.array(wordScrambleItem).min(2).max(50) });
function wordScramblePrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} word-scramble items for a ${targetLang} learner (native language: ${nativeLang}).`, sourceContent) +
    `Each item needs:\n- word: a single word in ${targetLang} (no spaces), 4+ letters, to be scrambled\n- hint: a short hint — either the ${nativeLang} translation or a short example sentence with the word blanked out\n` +
    footer(`{"items":[{"word":"...","hint":"..."}]}`);
}

// SYNONYM_ANTONYM — word, synonym, antonym, distractors
const synonymAntonymItem = z.object({
  word: z.string().min(1),
  synonym: z.string().min(1),
  antonym: z.string().min(1),
  distractors: z.array(z.string().min(1)).min(2).max(3),
});
const SYNONYM_ANTONYM_SCHEMA = z.object({ items: z.array(synonymAntonymItem).min(2).max(50) });
function synonymAntonymPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} synonym/antonym items for ${targetLang} vocabulary practice.`, sourceContent) +
    `Each item needs:\n- word: the target word in ${targetLang}\n- synonym: a true synonym in ${targetLang}\n- antonym: a true antonym in ${targetLang}\n- distractors: 2-3 unrelated ${targetLang} words (neither synonym nor antonym) to use as wrong answer choices\n` +
    footer(`{"items":[{"word":"...","synonym":"...","antonym":"...","distractors":["...","..."]}]}`);
}

// ODD_ONE_OUT — group of words, odd one, category
const oddOneOutItem = z.object({
  words: z.array(z.string().min(1)).min(4).max(5),
  oddWord: z.string().min(1),
  category: z.string().min(1),
});
const ODD_ONE_OUT_SCHEMA = z.object({ items: z.array(oddOneOutItem).min(1).max(30) });
function oddOneOutPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} "odd one out" rounds for ${targetLang} vocabulary practice.`, sourceContent) +
    `Each round needs:\n- words: 4-5 words in ${targetLang}, where all but one belong to the same category\n- oddWord: which one of those words does NOT belong (must be one of the strings in "words")\n- category: the name of the category the other words share\n` +
    footer(`{"items":[{"words":["...","...","...","..."],"oddWord":"...","category":"..."}]}`);
}

// PICTURE_TO_WORD — word, image search term, distractors
const pictureToWordItem = z.object({
  word: z.string().min(1),
  imageSearchTerm: z.string().min(1),
  distractors: z.array(z.string().min(1)).min(2).max(3),
});
const PICTURE_TO_WORD_SCHEMA = z.object({ items: z.array(pictureToWordItem).min(2).max(50) });
function pictureToWordPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} picture-to-word items for ${targetLang} vocabulary practice.`, sourceContent) +
    `Each item needs:\n- word: the ${targetLang} word being illustrated\n- imageSearchTerm: a concrete, unambiguous, safe-for-work search term (in English) that would reliably return a clear photo of this word's meaning\n- distractors: 2-3 other ${targetLang} words (concrete, also image-able) to use as wrong answer choices\n` +
    footer(`{"items":[{"word":"...","imageSearchTerm":"...","distractors":["...","..."]}]}`);
}

// COLLOCATION_BUILDER — base word, correct partners, wrong partners
const collocationItem = z.object({
  baseWord: z.string().min(1),
  correctPartners: z.array(z.string().min(1)).min(2).max(3),
  wrongPartners: z.array(z.string().min(1)).min(2).max(2),
});
const COLLOCATION_SCHEMA = z.object({ items: z.array(collocationItem).min(2).max(30) });
function collocationPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} collocation items for ${targetLang} vocabulary practice.`, sourceContent) +
    `Each item needs:\n- baseWord: a word in ${targetLang} that commonly collocates with other words (e.g. a verb or adjective)\n- correctPartners: 2-3 words in ${targetLang} that form a natural, correct collocation with baseWord\n- wrongPartners: exactly 2 words in ${targetLang} that would NOT naturally collocate with baseWord (plausible but wrong)\n` +
    footer(`{"items":[{"baseWord":"...","correctPartners":["...","..."],"wrongPartners":["...","..."]}]}`);
}

// MINIMAL_PAIR — two similar-sounding words
const minimalPairItem = z.object({
  wordA: z.string().min(1),
  wordB: z.string().min(1),
});
const MINIMAL_PAIR_SCHEMA = z.object({ items: z.array(minimalPairItem).min(2).max(30) });
function minimalPairPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} minimal-pair items for ${targetLang} pronunciation practice.`, sourceContent) +
    `Each item needs:\n- wordA: a word in ${targetLang}\n- wordB: a different word in ${targetLang} that sounds very similar to wordA (differs by one sound/phoneme — a true minimal pair), so a learner has to listen carefully to tell them apart\n` +
    footer(`{"items":[{"wordA":"...","wordB":"..."}]}`);
}

// SPEED_ROUND — word, distractors
const speedRoundItem = z.object({
  word: z.string().min(1),
  distractors: z.array(z.string().min(1)).min(2).max(3),
});
const SPEED_ROUND_SCHEMA = z.object({ items: z.array(speedRoundItem).min(2).max(50) });
function speedRoundPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} fast-recognition "speed round" items for ${targetLang} vocabulary practice.`, sourceContent) +
    `Each item needs:\n- word: the ${targetLang} word to recognize\n- distractors: 2-3 other ${targetLang} words to use as wrong quick-choice options\n` +
    footer(`{"items":[{"word":"...","distractors":["...","..."]}]}`);
}

// SITUATION_DIALOGUE_FILL — scenario, dialogue lines, blanks
const dialogueLine = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
  isBlank: z.boolean(),
});
const dialogueBlank = z.object({
  lineIndex: z.number().int().min(0),
  correctAnswer: z.string().min(1),
  distractors: z.array(z.string().min(1)).min(2).max(3),
});
const dialogueFillItem = z.object({
  scenario: z.string().min(1),
  lines: z.array(dialogueLine).min(4).max(8),
  blanks: z.array(dialogueBlank).min(1),
});
const DIALOGUE_FILL_SCHEMA = z.object({ items: z.array(dialogueFillItem).min(1).max(20) });
function dialogueFillPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} dialogue-fill exercises for a ${targetLang} learner (native language: ${nativeLang}).`, sourceContent) +
    `Each exercise needs:\n- scenario: one sentence in ${nativeLang} describing the situation (e.g. "Ordering coffee at a cafe")\n- lines: 4-8 dialogue lines, each with a "speaker" name, "text" in ${targetLang}, and "isBlank" (true if this line contains the blank to fill)\n- blanks: for each line where isBlank is true, give "lineIndex" (its 0-based index in "lines"), "correctAnswer" (the missing ${targetLang} word/phrase), and "distractors" (2-3 wrong but plausible ${targetLang} options)\n` +
    footer(`{"items":[{"scenario":"...","lines":[{"speaker":"A","text":"...___...","isBlank":true},{"speaker":"B","text":"...","isBlank":false}],"blanks":[{"lineIndex":0,"correctAnswer":"...","distractors":["...","..."]}]}]}`);
}

// WORD_IN_CONTEXT — word, correct sentence, incorrect sentences
const wordInContextItem = z.object({
  word: z.string().min(1),
  correctSentence: z.string().min(1),
  incorrectSentences: z.array(z.string().min(1)).min(2).max(3),
});
const WORD_IN_CONTEXT_SCHEMA = z.object({ items: z.array(wordInContextItem).min(2).max(30) });
function wordInContextPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} "word in context" items for ${targetLang} vocabulary practice.`, sourceContent) +
    `Each item needs:\n- word: a word in ${targetLang}\n- correctSentence: a sentence in ${targetLang} that uses "word" correctly and naturally\n- incorrectSentences: 2-3 sentences in ${targetLang} that use "word" in a way that is wrong (wrong meaning, wrong grammar, or wrong context) — each must still contain the word\n` +
    footer(`{"items":[{"word":"...","correctSentence":"...","incorrectSentences":["...","..."]}]}`);
}

// ═══════════════════════════════════════════════════════════
// GRAMMAR & WRITING GAMES
// ═══════════════════════════════════════════════════════════

// SENTENCE_BUILDER — one full correct sentence
const sentenceBuilderItem = z.object({
  correctSentence: z.string().min(3),
});
const SENTENCE_BUILDER_SCHEMA = z.object({ items: z.array(sentenceBuilderItem).min(2).max(30) });
function sentenceBuilderPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} sentences for a ${targetLang} sentence-building exercise.`, sourceContent) +
    `Each item needs:\n- correctSentence: one complete, grammatically correct sentence in ${targetLang}, appropriate for a language learner to rebuild by reordering its words\n` +
    footer(`{"items":[{"correctSentence":"..."}]}`);
}

// ERROR_SPOTTING — sentence with error, wrong part, correction, rule
const errorSpottingItem = z.object({
  sentenceWithError: z.string().min(3),
  wrongPart: z.string().min(1),
  correction: z.string().min(1),
  ruleExplanation: z.string().min(1),
});
const ERROR_SPOTTING_SCHEMA = z.object({ items: z.array(errorSpottingItem).min(2).max(30) });
function errorSpottingPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} error-spotting items for ${targetLang} grammar practice (learner's native language: ${nativeLang}).`, sourceContent) +
    `Each item needs:\n- sentenceWithError: a sentence in ${targetLang} containing exactly one grammar mistake\n- wrongPart: the exact incorrect word/phrase from that sentence\n- correction: the correct word/phrase that should replace wrongPart\n- ruleExplanation: a short explanation (in ${nativeLang}) of the grammar rule being tested\n` +
    footer(`{"items":[{"sentenceWithError":"...","wrongPart":"...","correction":"...","ruleExplanation":"..."}]}`);
}

// FILL_BLANK_GRAMMAR — sentence with blank, base verb, correct conjugation
const fillBlankGrammarItem = z.object({
  sentenceWithBlank: z.string().min(3),
  baseVerbForm: z.string().min(1),
  correctConjugatedForm: z.string().min(1),
});
const FILL_BLANK_GRAMMAR_SCHEMA = z.object({ items: z.array(fillBlankGrammarItem).min(2).max(30) });
function fillBlankGrammarPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} grammar fill-the-blank items for ${targetLang} practice.`, sourceContent) +
    `Each item needs:\n- sentenceWithBlank: a sentence in ${targetLang} with "___" where a verb should go\n- baseVerbForm: the verb's base/infinitive form, shown to the student as a hint\n- correctConjugatedForm: the correctly conjugated form that fills the blank\n` +
    footer(`{"items":[{"sentenceWithBlank":"... ___ ...","baseVerbForm":"...","correctConjugatedForm":"..."}]}`);
}

// VERB_CONJUGATION — verb, tense, forms per pronoun
const verbConjugationForm = z.object({
  pronoun: z.string().min(1),
  form: z.string().min(1),
});
const verbConjugationItem = z.object({
  verb: z.string().min(1),
  tense: z.string().min(1),
  forms: z.array(verbConjugationForm).min(2).max(20),
});
const VERB_CONJUGATION_SCHEMA = z.object({ items: z.array(verbConjugationItem).min(1).max(20) });
function verbConjugationPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} verb-conjugation tables for ${targetLang} practice.`, sourceContent) +
    `Each item needs:\n- verb: the infinitive form in ${targetLang}\n- tense: the tense name (e.g. "Present", "Past", "Future")\n- forms: entries per pronoun (I, you, he/she, we, they), each with "pronoun" and the correctly conjugated "form" in ${targetLang}\n` +
    footer(`{"items":[{"verb":"...","tense":"Present","forms":[{"pronoun":"I","form":"..."},{"pronoun":"you","form":"..."},{"pronoun":"he/she","form":"..."},{"pronoun":"we","form":"..."},{"pronoun":"they","form":"..."}]}]}`);
}

// MULTIPLE_CHOICE_GRAMMAR & QUIZ — question, 4 options, correct, explanation
const multipleChoiceItem = z.object({
  question: z.string().min(3),
  options: z.array(z.string().min(1)).length(4),
  correctOption: z.string().min(1),
  explanation: z.string().min(1),
});
const MULTIPLE_CHOICE_SCHEMA = z.object({ items: z.array(multipleChoiceItem).min(2).max(30) });
function multipleChoicePrompt(kind: "quiz" | "grammar") {
  return function ({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
    const body = kind === "grammar"
      ? `Each item needs:\n- question: a sentence in ${targetLang} with "___" marking the blank, testing a grammar point\n- options: exactly 4 answer choices in ${targetLang} (one correct, 3 plausible wrong ones)\n- correctOption: the exact text of the correct option (must match one of "options")\n- explanation: a short explanation of why that option is correct\n`
      : `Each item needs:\n- question: a quiz question about the source material, in ${targetLang}\n- options: exactly 4 answer choices in ${targetLang} (one correct, 3 plausible wrong ones)\n- correctOption: the exact text of the correct option (must match one of "options")\n- explanation: a short explanation of the correct answer\n`;
    return header(`Generate exactly ${count} multiple-choice ${kind === "grammar" ? "grammar" : "quiz"} items for ${targetLang} practice.`, sourceContent) +
      body + footer(`{"items":[{"question":"...","options":["...","...","...","..."],"correctOption":"...","explanation":"..."}]}`);
  };
}

// DRAG_DROP — items, categories, correct mapping
const dragDropItem = z.object({
  items: z.array(z.string().min(1)).min(4).max(12),
  categories: z.array(z.string().min(1)).min(2).max(5),
  correctMapping: z.record(z.string(), z.string()),
});
const DRAG_DROP_SCHEMA = z.object({ items: z.array(dragDropItem).min(1).max(15) });
function dragDropPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} drag-and-drop sorting exercises for ${targetLang} practice.`, sourceContent) +
    `Each exercise needs:\n- items: 4-12 words/phrases in ${targetLang} to sort\n- categories: 2-5 category names (in ${targetLang}) that each item belongs to\n- correctMapping: an object mapping each string in "items" to the exact category name (from "categories") it belongs to\n` +
    footer(`{"items":[{"items":["...","..."],"categories":["...","..."],"correctMapping":{"item1":"category1"}}]}`);
}

// FILL_BLANK / FILL_GAP_WORD — sentence with blank, correct word
const fillWordItem = z.object({
  sentenceWithBlank: z.string().min(3),
  correctWord: z.string().min(1),
});
const FILL_WORD_SCHEMA = z.object({ items: z.array(fillWordItem).min(2).max(30) });
function fillWordPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} fill-the-blank items for ${targetLang} practice.`, sourceContent) +
    `Each item needs:\n- sentenceWithBlank: a sentence in ${targetLang} with "___" marking exactly one missing word\n- correctWord: the missing word\n` +
    footer(`{"items":[{"sentenceWithBlank":"... ___ ...","correctWord":"..."}]}`);
}

// STORY — writing prompt + optional word bank
const storyItem = z.object({
  writingPrompt: z.string().min(3),
  wordBank: z.array(z.string()).optional(),
});
const STORY_SCHEMA = z.object({ items: z.array(storyItem).min(1).max(10) });
function storyPrompt({ sourceContent, count, targetLang, nativeLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} creative-writing prompts for a ${targetLang} learner (native language: ${nativeLang}).`, sourceContent) +
    `Each item needs:\n- writingPrompt: a short writing prompt in ${nativeLang} (or ${targetLang}) that invites a short piece of writing\n- wordBank: optional array of 5-10 ${targetLang} words the student should try to use\n` +
    footer(`{"items":[{"writingPrompt":"...","wordBank":["...","..."]}]}`);
}

// ═══════════════════════════════════════════════════════════
// LISTENING GAMES
// ═══════════════════════════════════════════════════════════

// DICTATION / LISTEN_FILL_SENTENCE / SPEAK_FILL_SENTENCE — one full sentence
const oneSentenceItem = z.object({ sentence: z.string().min(3) });
const ONE_SENTENCE_SCHEMA = z.object({ items: z.array(oneSentenceItem).min(2).max(30) });
function oneSentencePrompt(mode: "dictation" | "reorder" | "speak") {
  return function ({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
    const purpose = mode === "dictation" ? "to be read aloud and typed back by the student"
      : mode === "reorder" ? "to be read aloud, then reconstructed by the student from shuffled words"
      : "to be read aloud by the student for pronunciation practice";
    return header(`Generate exactly ${count} sentences in ${targetLang}, ${purpose}.`, sourceContent) +
      `Each item needs:\n- sentence: one complete, natural sentence in ${targetLang}\n` +
      footer(`{"items":[{"sentence":"..."}]}`);
  };
}

// LISTEN_FILL_WORD / SPEAK_FILL_WORD — sentence with blank, correct word
const LISTEN_FILL_WORD_SCHEMA = FILL_WORD_SCHEMA; // Same shape as FILL_WORD
function listenFillWordPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} listen/speak-and-fill-the-word items for ${targetLang} practice.`, sourceContent) +
    `Each item needs:\n- sentenceWithBlank: a sentence in ${targetLang} with "___" marking exactly one missing word\n- correctWord: the missing word\n` +
    footer(`{"items":[{"sentenceWithBlank":"... ___ ...","correctWord":"..."}]}`);
}

// ═══════════════════════════════════════════════════════════
// CROSSWORD — word + clue
const crosswordWordItem = z.object({
  word: z.string().min(2),
  clue: z.string().min(1),
});
const CROSSWORD_SCHEMA = z.object({ items: z.array(crosswordWordItem).min(4).max(20) });
function crosswordPrompt({ sourceContent, count, targetLang }: Parameters<PromptBuilder>[0]) {
  return header(`Generate exactly ${count} crossword words for ${targetLang} vocabulary practice.`, sourceContent) +
    `Each item needs:\n- word: the answer word in ${targetLang} (single word, no spaces)\n- clue: a definition-based clue in ${targetLang} — describe what the word means, NEVER use the word itself or an obvious root of it\n` +
    footer(`{"items":[{"word":"...","clue":"..."}]}`);
}

// ═══════════════════════════════════════════════════════════
// SCHEMA REGISTRY
// ═══════════════════════════════════════════════════════════

export const GAME_SCHEMAS: Record<string, GameSchemaConfig> = {
  // Vocabulary — word pair family
  FLASHCARD: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, description: "Word-translation flashcard pairs with an example sentence" },
  MEMORY: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, description: "Memory match word/translation pairs" },
  FLASHCARD_3D: { schema: WORD_PAIR_SCHEMA, buildPrompt: wordPairPrompt, description: "Floating word/translation matching pairs" },
  WORD_MEANING_MATCH: { schema: WORD_MEANING_SCHEMA, buildPrompt: wordMeaningPrompt, description: "Word + definition/translation pairs" },
  WORD_SCRAMBLE: { schema: WORD_SCRAMBLE_SCHEMA, buildPrompt: wordScramblePrompt, description: "Word scramble puzzle items with a hint" },

  // Vocabulary — dedicated shapes
  SYNONYM_ANTONYM: { schema: SYNONYM_ANTONYM_SCHEMA, buildPrompt: synonymAntonymPrompt, description: "Word + synonym + antonym + distractors" },
  ODD_ONE_OUT: { schema: ODD_ONE_OUT_SCHEMA, buildPrompt: oddOneOutPrompt, description: "Groups of words with one odd word out and a category" },
  PICTURE_TO_WORD: { schema: PICTURE_TO_WORD_SCHEMA, buildPrompt: pictureToWordPrompt, description: "Word + image search term + distractors" },
  COLLOCATION_BUILDER: { schema: COLLOCATION_SCHEMA, buildPrompt: collocationPrompt, description: "Base word + correct/wrong collocation partners" },
  MINIMAL_PAIR: { schema: MINIMAL_PAIR_SCHEMA, buildPrompt: minimalPairPrompt, description: "Pairs of similar-sounding words" },
  SPEED_ROUND: { schema: SPEED_ROUND_SCHEMA, buildPrompt: speedRoundPrompt, description: "Word + distractors for fast recognition" },
  SITUATION_DIALOGUE_FILL: { schema: DIALOGUE_FILL_SCHEMA, buildPrompt: dialogueFillPrompt, description: "Scenario + dialogue lines + blanks with distractors" },
  WORD_IN_CONTEXT: { schema: WORD_IN_CONTEXT_SCHEMA, buildPrompt: wordInContextPrompt, description: "Word + one correct sentence + incorrect sentences" },
  CROSSWORD: { schema: CROSSWORD_SCHEMA, buildPrompt: crosswordPrompt, description: "Word + definition-based clue" },

  // Grammar & writing
  SENTENCE_BUILDER: { schema: SENTENCE_BUILDER_SCHEMA, buildPrompt: sentenceBuilderPrompt, description: "One full correct sentence to reorder" },
  ERROR_SPOTTING: { schema: ERROR_SPOTTING_SCHEMA, buildPrompt: errorSpottingPrompt, description: "Sentence with error + wrong part + correction + rule" },
  FILL_BLANK_GRAMMAR: { schema: FILL_BLANK_GRAMMAR_SCHEMA, buildPrompt: fillBlankGrammarPrompt, description: "Sentence with blank + base verb + correct conjugation" },
  VERB_CONJUGATION: { schema: VERB_CONJUGATION_SCHEMA, buildPrompt: verbConjugationPrompt, description: "Verb + tense + conjugation per pronoun" },
  MULTIPLE_CHOICE_GRAMMAR: { schema: MULTIPLE_CHOICE_SCHEMA, buildPrompt: multipleChoicePrompt("grammar"), description: "Sentence with blank + 4 options + correct + explanation" },
  DRAG_DROP: { schema: DRAG_DROP_SCHEMA, buildPrompt: dragDropPrompt, description: "Items + target categories + correct mapping" },
  QUIZ: { schema: MULTIPLE_CHOICE_SCHEMA, buildPrompt: multipleChoicePrompt("quiz"), description: "Question + 4 options + correct + explanation" },
  STORY: { schema: STORY_SCHEMA, buildPrompt: storyPrompt, description: "Writing prompt + optional word bank" },
  FILL_BLANK: { schema: FILL_WORD_SCHEMA, buildPrompt: fillWordPrompt, description: "Sentence with blank + correct word" },
  FILL_GAP_WORD: { schema: FILL_WORD_SCHEMA, buildPrompt: fillWordPrompt, description: "Sentence with blank + correct word" },

  // Listening
  DICTATION: { schema: ONE_SENTENCE_SCHEMA, buildPrompt: oneSentencePrompt("dictation"), description: "One sentence to read aloud and type back" },
  LISTEN_FILL_WORD: { schema: LISTEN_FILL_WORD_SCHEMA, buildPrompt: listenFillWordPrompt, description: "Sentence with blank + correct word (listened to)" },
  LISTEN_FILL_SENTENCE: { schema: ONE_SENTENCE_SCHEMA, buildPrompt: oneSentencePrompt("reorder"), description: "One full sentence to reconstruct after listening" },
  SPEAK_FILL_WORD: { schema: LISTEN_FILL_WORD_SCHEMA, buildPrompt: listenFillWordPrompt, description: "Sentence with blank + correct word (spoken)" },
  SPEAK_FILL_SENTENCE: { schema: ONE_SENTENCE_SCHEMA, buildPrompt: oneSentencePrompt("speak"), description: "One full sentence to speak aloud" },
};

export function getGameSchema(type: string): GameSchemaConfig | null {
  return GAME_SCHEMAS[type] ?? null;
}
