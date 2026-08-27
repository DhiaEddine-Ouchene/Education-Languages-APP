// ── Single source-of-truth builder schemas ──
// Faithful TypeScript port of the reference project's `src/builder/schemas.js`.
// One schema per PLAY ENGINE (mcq, fillblank, texttask, tapword, order, match,
// sort, memory, crossword, writing, speaking). Every app GAME_TYPE resolves to
// exactly one of these engines via `folderEngineForType`, so a single generic
// builder can author content for all game types.
//
// The schema drives three things at once:
//   1. the teacher builder form (which fields to render),
//   2. the AI-autofill target shape (aiExample / aiHint),
//   3. the parse step that turns form values into engine-ready `data`.
//
// Field types: text, textarea, lines, pairs, defs, items, entries, rules,
//              words, number, bool, select, dialogue

import { folderEngineForType } from "@/lib/folder-game-data";

export type FieldType =
  | "text"
  | "textarea"
  | "lines"
  | "pairs"
  | "defs"
  | "items"
  | "entries"
  | "rules"
  | "words"
  | "number"
  | "bool"
  | "select"
  | "dialogue"
  | "cards";

export interface SchemaField {
  k: string;
  label: string;
  type: FieldType;
  ph?: string;
  opts?: string[];
}

export type SchemaKind = "rounds" | "data";

export interface BuilderSchema {
  /** play engine key this schema authors for */
  engine: string;
  name: string;
  emoji: string;
  kind: SchemaKind;
  cats: string[];
  blurb: string;
  exampleText: string;
  aiHint: string;
  /** per-round fields (kind === 'rounds') OR the whole-object fields (kind === 'data') */
  fields: SchemaField[];
  /** top-level fields that live outside the rounds array (kind === 'rounds' only) */
  dataFields?: SchemaField[];
  /** example content: an array of rounds for kind 'rounds', a single object for kind 'data' */
  aiExample: any;
}

// ── Engine schemas (ported verbatim from the reference SCHEMAS map) ──
export const BUILDER_SCHEMAS: Record<string, BuilderSchema> = {
  flashcard: {
    engine: "flashcard",
    name: "Flashcard",
    emoji: "🃏",
    kind: "data",
    cats: ["vocabulary"],
    blurb: "Flip a card to reveal the meaning, then self-rate know / still learning",
    exampleText: "apple → تفاحة (noun · “I ate a red apple.”)",
    aiHint: "Each card has front (the word to learn), back (its translation/meaning), and optional hint (part of speech) and example sentence. No wrong answers — this is study + self-assessment.",
    fields: [
      { k: "task", label: "Deck title / instruction (optional)", type: "text", ph: "Study these words" },
      { k: "cards", label: "Cards — one per line as: word | meaning | hint (optional) | example (optional)", type: "cards", ph: "apple | تفاحة | noun | I ate a red apple.\nhouse | منزل | noun | This is my house." },
    ],
    aiExample: {
      task: "Study these words",
      cards: [
        { front: "apple", back: "تفاحة", hint: "noun", example: "I ate a red apple." },
        { front: "house", back: "منزل", hint: "noun", example: "This is my house." },
        { front: "water", back: "ماء", hint: "noun", example: "I drink water every day." },
      ],
    },
  },
  mcq: {
    engine: "mcq",
    name: "Multiple choice",
    emoji: "✅",
    kind: "rounds",
    cats: ["vocabulary", "grammar", "listening"],
    blurb: "Synonyms, odd-one-out, picture-to-word, collocations, listening choices",
    exampleText: "Pick the synonym of “happy” → glad, angry, tired, hungry",
    aiHint: "Each round is one question. Include a short explanation of the correct answer.",
    fields: [
      { k: "sub", label: "Instruction tag", type: "text", ph: "Pick the synonym" },
      { k: "prompt", label: "Prompt word or sentence (optional)", type: "text", ph: "happy" },
      { k: "image", label: "Emoji image (optional)", type: "text", ph: "🐘" },
      { k: "audioText", label: "Audio text — read aloud (optional)", type: "text" },
      { k: "options", label: "Options (one per line)", type: "lines", ph: "glad\nangry\ntired\nhungry" },
      { k: "answer", label: "Correct answer (must equal one option)", type: "text", ph: "glad" },
      { k: "explain", label: "Why? Shown after answering", type: "text" },
      { k: "stack", label: "Stack options vertically (for sentences)", type: "bool" },
    ],
    aiExample: [
      { sub: "Pick the synonym", prompt: "happy", options: ["glad", "angry", "tired", "hungry"], answer: "glad", explain: "'Glad' means the same as 'happy'." },
    ],
  },
  fillblank: {
    engine: "fillblank",
    name: "Fill the blank",
    emoji: "🪣",
    kind: "rounds",
    cats: ["vocabulary", "grammar", "listening"],
    blurb: "Vocabulary gaps, grammar gaps, conjugation, listen & fill",
    exampleText: "She drinks a cup of ___ every morning → coffee",
    aiHint: "Each round has a sentence containing ___ as the blank. 'answer' fills the blank. Include 3-4 options.",
    fields: [
      { k: "task", label: "Instruction tag (optional)", type: "text", ph: "to go — she, present simple" },
      { k: "text", label: "Sentence with ___ as the blank", type: "text", ph: "She ___ to work by bus." },
      { k: "options", label: "Options, one per line (empty = typed answer)", type: "lines" },
      { k: "answer", label: "Correct answer", type: "text", ph: "goes" },
      { k: "rule", label: "Rule card shown after answering (optional)", type: "text" },
      { k: "explain", label: "Why? (optional)", type: "text" },
      { k: "audioText", label: "Audio text — read aloud (optional)", type: "text" },
      { k: "maxReplays", label: "Max audio replays (optional)", type: "number", ph: "3" },
    ],
    aiExample: [
      { text: "She drinks a cup of ___ every morning.", options: ["coffee", "shoe", "cloud", "chair"], answer: "coffee", explain: "You drink coffee in the morning." },
    ],
  },
  texttask: {
    engine: "texttask",
    name: "Type the answer",
    emoji: "⌨️",
    kind: "rounds",
    cats: ["grammar", "listening"],
    blurb: "Sentence transformation, dictation",
    exampleText: "Make negative: “She likes coffee.” → “She doesn’t like coffee”",
    aiHint: "'answers' lists all accepted variants (punctuation and case are ignored when checking).",
    fields: [
      { k: "instruction", label: "Instruction", type: "text", ph: "Make this sentence negative" },
      { k: "prompt", label: "Prompt sentence (optional)", type: "text", ph: "She likes coffee." },
      { k: "audioText", label: "Audio text — for dictation (optional)", type: "text" },
      { k: "maxReplays", label: "Max audio replays (optional)", type: "number" },
      { k: "answers", label: "Accepted answers (one per line)", type: "lines", ph: "She doesn't like coffee\nShe does not like coffee" },
      { k: "explain", label: "Why? (optional)", type: "text" },
    ],
    aiExample: [
      { instruction: "Make this sentence negative", prompt: "She likes coffee.", answers: ["She doesn't like coffee", "She does not like coffee"], explain: "Present simple negative: doesn't + base verb." },
    ],
  },
  tapword: {
    engine: "tapword",
    name: "Error spotting",
    emoji: "🔍",
    kind: "rounds",
    cats: ["grammar"],
    blurb: "Tap the wrong word, then pick the correction",
    exampleText: "“She go to school.” → tap “go”, fix → goes",
    aiHint: "'words' is the sentence split into words. 'errorIndex' is the 0-based position of the wrong word. 'correction' must be one of 'corrections'.",
    fields: [
      { k: "words", label: "Sentence (words separated by spaces)", type: "words", ph: "She go to school every day." },
      { k: "errorIndex", label: "Position of the wrong word (first word = 0)", type: "number", ph: "1" },
      { k: "corrections", label: "Correction options (one per line)", type: "lines", ph: "goes\ngoing\ngone" },
      { k: "correction", label: "Correct fix", type: "text", ph: "goes" },
      { k: "explain", label: "Why?", type: "text" },
    ],
    aiExample: [
      { words: ["She", "go", "to", "school", "every", "day."], errorIndex: 1, corrections: ["goes", "going", "gone"], correction: "goes", explain: "Third person singular adds -s: 'she goes'." },
    ],
  },
  order: {
    engine: "order",
    name: "Order the chips",
    emoji: "🧱",
    kind: "rounds",
    cats: ["vocabulary", "grammar", "listening"],
    blurb: "Build the sentence, word scramble, listen & order",
    exampleText: "Put in order → “She is reading a book”",
    aiHint: "For sentences, 'answer' is the full correct sentence. For letter scrambles set the chip type to letters and 'answer' is a single word. 'fragments' (optional) are phrase chips for listening order.",
    dataFields: [{ k: "mode", label: "Chip type", type: "select", opts: ["words", "letters"] }],
    fields: [
      { k: "hint", label: "Hint tag (optional)", type: "text", ph: "Put the words in order" },
      { k: "answer", label: "Correct sentence or word", type: "text", ph: "She is reading a book" },
      { k: "fragments", label: "Phrase fragments, one per line (optional, overrides answer split)", type: "lines" },
      { k: "audioText", label: "Audio text — read aloud (optional)", type: "text" },
      { k: "maxReplays", label: "Max audio replays (optional)", type: "number" },
      { k: "explain", label: "Note shown after answering (optional)", type: "text" },
    ],
    aiExample: [{ hint: "Put the words in order", answer: "She is reading a book" }],
  },
  match: {
    engine: "match",
    name: "Match pairs",
    emoji: "🧭",
    kind: "rounds",
    cats: ["vocabulary", "grammar"],
    blurb: "Word ↔ definition, sentence ↔ tense label",
    exampleText: "Match: ancient ↔ very old, rapid ↔ very fast",
    aiHint: "Each round has 3-5 pairs. Each pair is [left, right].",
    dataFields: [{ k: "task", label: "Instruction shown above the pairs", type: "text", ph: "Match each word to its meaning" }],
    fields: [
      { k: "pairs", label: "Pairs — one per line as: left | right", type: "pairs", ph: "ancient | very old\nrapid | very fast" },
    ],
    aiExample: [
      { pairs: [["ancient", "very old"], ["rapid", "very fast"], ["fragile", "easily broken"], ["generous", "happy to give"]] },
    ],
  },
  sort: {
    engine: "sort",
    name: "Category sort",
    emoji: "🗂️",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Sort words into buckets",
    exampleText: "Sort: spoon → Kitchen, passport → Travel",
    aiHint: "2-4 categories, 6-9 items. Each item's 'cat' must equal one of 'categories'.",
    fields: [
      { k: "categories", label: "Categories (one per line, 2-4)", type: "lines", ph: "Kitchen\nTravel\nOffice" },
      { k: "items", label: "Items — one per line as: word | category", type: "items", ph: "spoon | Kitchen\npassport | Travel" },
    ],
    aiExample: [
      { categories: ["Kitchen", "Travel"], items: [{ word: "spoon", cat: "Kitchen" }, { word: "passport", cat: "Travel" }, { word: "oven", cat: "Kitchen" }, { word: "suitcase", cat: "Travel" }] },
    ],
  },
  memory: {
    engine: "memory",
    name: "Memory match",
    emoji: "🃏",
    kind: "data",
    cats: ["vocabulary"],
    blurb: "Flip cards to find pairs, with definition popups",
    exampleText: "Flip to match: happy ↔ glad, big ↔ large",
    aiHint: "4-6 pairs. 'defs' gives a short definition for the FIRST word of each pair (shown as a popup on match).",
    fields: [
      { k: "pairs", label: "Card pairs — one per line as: word | match", type: "pairs", ph: "happy | glad\nbig | large" },
      { k: "defs", label: "Definitions — one per line as: word | definition", type: "defs", ph: "happy | Feeling pleasure or joy" },
    ],
    aiExample: { pairs: [["happy", "glad"], ["big", "large"], ["fast", "quick"], ["begin", "start"]], defs: { happy: "Feeling pleasure or joy.", big: "Of great size.", fast: "Moving quickly.", begin: "To start something." } },
  },
  crossword: {
    engine: "crossword",
    name: "Crossword",
    emoji: "🧩",
    kind: "data",
    cats: ["vocabulary"],
    blurb: "Grid puzzle with definition clues",
    exampleText: "Across: TICKET (You need this to board.) · TRAIN (It runs on rails.)",
    aiHint: "5-7 entries. Words must interlock: crossing words must share the same letter at the intersection cell (row/col are 0-based grid coordinates, dir is 'across' or 'down'). Double-check every intersection.",
    fields: [
      { k: "entries", label: "Entries — one per line as: WORD | clue | row | col | across/down", type: "entries", ph: "TICKET | You need this to board. | 0 | 0 | across\nTRAIN | It runs on rails. | 0 | 0 | down" },
    ],
    aiExample: { entries: [{ word: "TICKET", clue: "You need this to board a train.", row: 0, col: 0, dir: "across" }, { word: "TRAIN", clue: "It runs on rails.", row: 0, col: 0, dir: "down" }] },
  },
  writing: {
    engine: "writing",
    name: "Writing task",
    emoji: "✍️",
    kind: "data",
    cats: ["writing"],
    blurb: "Free writing with a live rubric checklist",
    exampleText: "Prompt: “Describe your favourite meal” + word bank + checklist",
    aiHint: "Rubric rules: {op:'minWords', a:'30'} | {op:'minSentences', a:'3'} | {op:'includes', a:'word1, word2, word3', b:'2'} (uses at least b of the listed words) | {op:'startsWith', a:'text'} | {op:'endsWith', a:'.'}",
    fields: [
      { k: "prompt", label: "Writing prompt", type: "textarea", ph: "Describe your last holiday." },
      { k: "wordBank", label: "Word bank (one per line, optional)", type: "lines" },
      { k: "starter", label: "Sentence starter (optional)", type: "text" },
      { k: "prefill", label: "Prefilled text to correct (optional)", type: "textarea" },
      { k: "note", label: "Note to the student (optional)", type: "text" },
      { k: "teacherReview", label: "Teacher-reviewed (not auto-graded)", type: "bool" },
      { k: "rules", label: "Rubric rules — one per line as: op | a | b", type: "rules", ph: "minWords | 30\nminSentences | 3\nincludes | visited, beautiful, relaxed | 2" },
    ],
    aiExample: { prompt: "Describe your favourite meal.", wordBank: ["delicious", "flavour", "spicy", "fresh"], teacherReview: false, rules: [{ op: "minWords", a: "30" }, { op: "minSentences", a: "3" }, { op: "includes", a: "delicious, flavour, spicy, fresh", b: "2" }] },
  },
  speaking: {
    engine: "speaking",
    name: "Speaking task",
    emoji: "🎤",
    kind: "rounds",
    cats: ["speaking"],
    blurb: "Repeat, read aloud, speak the gap, roleplay, describe",
    exampleText: "Listen & repeat: “Nice to meet you.”",
    aiHint: "mode is one of: gap (say the blank in 'display', target = the word), repeat (play audioText, target = same text), read (read 'display', target = same), roleplay (audioText plays a line, keywords = expected words), describe (image + free description, no target).",
    fields: [
      { k: "task", label: "Instruction tag", type: "text", ph: "Listen, then repeat" },
      { k: "mode", label: "Mode", type: "select", opts: ["gap", "repeat", "read", "roleplay", "describe"] },
      { k: "display", label: "Text shown on screen (optional)", type: "text" },
      { k: "audioText", label: "Audio text — read aloud (optional)", type: "text" },
      { k: "target", label: "Expected speech (for scoring)", type: "text" },
      { k: "keywords", label: "Keywords (one per line, roleplay only)", type: "lines" },
      { k: "image", label: "Emoji image (describe mode)", type: "text" },
      { k: "note", label: "Note to the student (optional)", type: "text" },
    ],
    aiExample: [{ task: "Listen, then repeat", mode: "repeat", audioText: "Nice to meet you.", target: "Nice to meet you" }],
  },
};

// ── Per-TYPE schema overrides ──
// Some game TYPES share a play ENGINE but are conceptually distinct (e.g. all the
// mcq-based vocab games). A per-type schema gives the teacher a builder whose fields,
// labels, example and instructions match THAT concept, while still targeting the shared
// engine. Every field declared here is a superset of the keys the AI converter
// (lib/ai-to-engine.ts) emits for this type, so AI-generated games round-trip cleanly
// through the builder (buildEngineData drops any key not declared as a field).
//
// INVARIANT: each schema's `engine` MUST equal folderEngineForType(type), because the
// live preview renders `schema.engine` while real play uses folderEngineForType(type).
export const TYPE_SCHEMAS: Record<string, BuilderSchema> = {
  // ── FLASHCARD → flashcard: flip a card, reveal the meaning, self-rate ──
  FLASHCARD: {
    engine: "flashcard",
    name: "Flashcard",
    emoji: "🃏",
    kind: "data",
    cats: ["vocabulary"],
    blurb: "Flip a card to reveal the meaning, then self-rate know / still learning",
    exampleText: "apple → تفاحة (noun · “I ate a red apple.”)",
    aiHint: "Each card has front (the word to learn), back (its translation/meaning), optional hint (part of speech) and example sentence. This is study + self-assessment — there is no wrong answer.",
    fields: [
      { k: "task", label: "Deck title / instruction (optional)", type: "text", ph: "Study these words" },
      { k: "cards", label: "Cards — one per line as: word | meaning | hint (optional) | example (optional)", type: "cards", ph: "apple | تفاحة | noun | I ate a red apple.\nhouse | منزل | noun | This is my house." },
    ],
    aiExample: {
      task: "Study these words",
      cards: [
        { front: "apple", back: "تفاحة", hint: "noun", example: "I ate a red apple." },
        { front: "house", back: "منزل", hint: "noun", example: "This is my house." },
        { front: "water", back: "ماء", hint: "noun", example: "I drink water every day." },
      ],
    },
  },

  // ── SYNONYM_ANTONYM → mcq: pick the synonym / opposite ──
  SYNONYM_ANTONYM: {
    engine: "mcq",
    name: "Synonym & Antonym",
    emoji: "🔤",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Pick the word with the same (or opposite) meaning",
    exampleText: "Pick the synonym of “happy” → glad",
    aiHint: "'prompt' is the target word. 'sub' says whether to pick the synonym or the opposite. 'answer' is one of 'options'.",
    fields: [
      { k: "sub", label: "Instruction tag", type: "text", ph: "Pick the synonym of “happy”" },
      { k: "prompt", label: "Target word (shown large)", type: "text", ph: "happy" },
      { k: "options", label: "Answer choices (one per line)", type: "lines", ph: "glad\nangry\ntired\nhungry" },
      { k: "answer", label: "Correct answer (must equal one option)", type: "text", ph: "glad" },
      { k: "explain", label: "Why? Shown after answering (optional)", type: "text", ph: "“glad” means the same as “happy”." },
    ],
    aiExample: [
      { sub: "Pick the synonym of “happy”", prompt: "happy", options: ["glad", "angry", "tired", "hungry"], answer: "glad", explain: "“glad” means the same as “happy”." },
      { sub: "Pick the opposite of “big”", prompt: "big", options: ["small", "large", "huge", "wide"], answer: "small", explain: "“small” is the opposite of “big”." },
    ],
  },

  // ── FILL_GAP_WORD → fillblank: complete the sentence ──
  FILL_GAP_WORD: {
    engine: "fillblank",
    name: "Fill the Gap",
    emoji: "📝",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Complete a sentence with the missing word",
    exampleText: "I eat an ___ every morning. → apple",
    aiHint: "'text' is a sentence containing ___ for the blank. 'answer' fills it. 'options' (optional) turn it into multiple choice; leave empty for typed input.",
    fields: [
      { k: "task", label: "Instruction tag (optional)", type: "text", ph: "Choose the missing word" },
      { k: "text", label: "Sentence with ___ as the blank", type: "text", ph: "I eat an ___ every morning." },
      { k: "options", label: "Options, one per line (empty = typed answer)", type: "lines", ph: "apple\nchair\ncloud\nshoe" },
      { k: "answer", label: "Correct answer", type: "text", ph: "apple" },
      { k: "explain", label: "Why? Shown after answering (optional)", type: "text" },
    ],
    aiExample: [
      { text: "I eat an ___ every morning.", options: ["apple", "chair", "cloud", "shoe"], answer: "apple", explain: "You eat an apple — it's a fruit." },
      { text: "She writes with a ___.", options: ["pen", "door", "river", "song"], answer: "pen", explain: "You write with a pen." },
    ],
  },

  // ── SITUATION_DIALOGUE_FILL → fillblank: complete a real conversation (dialogue bubbles) ──
  SITUATION_DIALOGUE_FILL: {
    engine: "fillblank",
    name: "Situational Dialogue",
    emoji: "💬",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Complete a real conversation shown as chat bubbles",
    exampleText: "Waiter: “What would you like?” · You: “I ___ a coffee.” → would like",
    aiHint: "Each round is one conversation shown as chat bubbles. In 'dialogue', the learner's turn (side B) contains ___. 'answer' fills that blank; 'options' are the choices.",
    fields: [
      { k: "task", label: "Scenario / instruction", type: "text", ph: "Ordering at a café" },
      { k: "dialogue", label: "Conversation — one turn per line as: A/B | speaker | text (A = other person on the left, B = you on the right; put ___ in the learner's line)", type: "dialogue", ph: "A | Waiter | Good morning! What would you like?\nB | You | I ___ a coffee, please." },
      { k: "options", label: "Options, one per line (empty = typed answer)", type: "lines", ph: "would like\nam\nhave been\nwill" },
      { k: "answer", label: "Correct answer (fills the ___)", type: "text", ph: "would like" },
      { k: "explain", label: "Why? Shown after answering (optional)", type: "text" },
    ],
    aiExample: [
      {
        task: "Ordering at a café",
        dialogue: [
          { s: "A", name: "Waiter", line: "Good morning! What would you like?" },
          { s: "B", name: "You", line: "I ___ a coffee, please." },
        ],
        options: ["would like", "am", "have been", "will"],
        answer: "would like",
        explain: "“I would like…” is a polite way to order.",
      },
      {
        task: "Meeting someone new",
        dialogue: [
          { s: "A", name: "Sara", line: "Hi! Nice to meet you." },
          { s: "B", name: "You", line: "Nice to meet you ___." },
        ],
        options: ["too", "again", "yesterday", "never"],
        answer: "too",
        explain: "“Nice to meet you too” is the natural reply.",
      },
    ],
  },

  // ── WORD_SCRAMBLE → order (letters): unscramble to spell the word ──
  WORD_SCRAMBLE: {
    engine: "order",
    name: "Word Scramble",
    emoji: "🔀",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Drag the letters into the right order to spell the word",
    exampleText: "P·P·L·E·A + hint “a red fruit” → APPLE",
    aiHint: "'answer' is the word to spell (letters get scrambled). 'hint' helps the learner. Keep chip type on 'letters'.",
    dataFields: [{ k: "mode", label: "Chip type", type: "select", opts: ["letters", "words"] }],
    fields: [
      { k: "hint", label: "Hint", type: "text", ph: "A red fruit" },
      { k: "answer", label: "Word to unscramble", type: "text", ph: "apple" },
      { k: "explain", label: "Note shown after answering (optional)", type: "text" },
    ],
    aiExample: [
      { hint: "A red fruit", answer: "apple" },
      { hint: "You live in it", answer: "house" },
    ],
  },

  // ── CROSSWORD → crossword: definition-clue grid ──
  CROSSWORD: {
    engine: "crossword",
    name: "Vocabulary Crossword",
    emoji: "🧩",
    kind: "data",
    cats: ["vocabulary"],
    blurb: "Fill an interlocking grid from definition clues",
    exampleText: "Across: TICKET (You need this to board.) · Down: TRAIN (It runs on rails.)",
    aiHint: "5-7 entries that interlock — crossing words must share the same letter at the intersection cell. row/col are 0-based; dir is across or down. Double-check every crossing.",
    fields: [
      { k: "entries", label: "Entries — one per line as: WORD | clue | row | col | across/down", type: "entries", ph: "TICKET | You need this to board. | 0 | 0 | across\nTRAIN | It runs on rails. | 0 | 0 | down" },
    ],
    aiExample: { entries: [{ word: "TICKET", clue: "You need this to board a train.", row: 0, col: 0, dir: "across" }, { word: "TRAIN", clue: "It runs on rails.", row: 0, col: 0, dir: "down" }] },
  },

  // ── PICTURE_TO_WORD → mcq: see an emoji picture, pick the word ──
  PICTURE_TO_WORD: {
    engine: "mcq",
    name: "Picture to Word",
    emoji: "🖼️",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Show a picture (emoji), pick the matching word",
    exampleText: "🍎 → apple",
    aiHint: "'image' is a single emoji shown large as the picture. 'options' are word choices; 'answer' is the word the picture shows. Do NOT reveal the word in the tag.",
    fields: [
      { k: "sub", label: "Instruction tag", type: "text", ph: "Which word matches the picture?" },
      { k: "image", label: "Picture — a single emoji (shown large)", type: "text", ph: "🍎" },
      { k: "options", label: "Word choices (one per line)", type: "lines", ph: "apple\nbanana\ncar\nbook" },
      { k: "answer", label: "Correct word (must equal one option)", type: "text", ph: "apple" },
      { k: "explain", label: "Why? Shown after answering (optional)", type: "text" },
    ],
    aiExample: [
      { sub: "Which word matches the picture?", image: "🍎", options: ["apple", "banana", "car", "book"], answer: "apple" },
      { sub: "Which word matches the picture?", image: "🐘", options: ["elephant", "mouse", "table", "cloud"], answer: "elephant" },
    ],
  },

  // ── CATEGORY_SORT → sort: drop words into buckets ──
  CATEGORY_SORT: {
    engine: "sort",
    name: "Category Sort",
    emoji: "🗂️",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Sort each word into the right category bucket",
    exampleText: "spoon → Kitchen · passport → Travel",
    aiHint: "2-4 categories and 6-9 items. Each item's category must match one of the categories exactly.",
    fields: [
      { k: "categories", label: "Categories (one per line, 2-4)", type: "lines", ph: "Fruits\nAnimals" },
      { k: "items", label: "Items — one per line as: word | category", type: "items", ph: "apple | Fruits\ndog | Animals" },
    ],
    aiExample: [
      { categories: ["Fruits", "Animals"], items: [{ word: "apple", cat: "Fruits" }, { word: "dog", cat: "Animals" }, { word: "banana", cat: "Fruits" }, { word: "cat", cat: "Animals" }, { word: "pear", cat: "Fruits" }, { word: "horse", cat: "Animals" }] },
    ],
  },

  // ── MEMORY → memory: flip cards to find matching pairs ──
  MEMORY: {
    engine: "memory",
    name: "Memory Match",
    emoji: "🃏",
    kind: "data",
    cats: ["vocabulary"],
    blurb: "Flip cards two at a time to find matching pairs",
    exampleText: "happy ↔ glad · big ↔ large",
    aiHint: "4-6 pairs. 'defs' gives an optional short definition for the first word of a pair, shown when it's matched.",
    fields: [
      { k: "pairs", label: "Card pairs — one per line as: word | match", type: "pairs", ph: "happy | glad\nbig | large" },
      { k: "defs", label: "Definitions — one per line as: word | definition (optional)", type: "defs", ph: "happy | Feeling pleasure or joy" },
    ],
    aiExample: { pairs: [["happy", "glad"], ["big", "large"], ["fast", "quick"], ["begin", "start"]], defs: { happy: "Feeling pleasure or joy.", big: "Of great size." } },
  },

  // ── WORD_MEANING_MATCH → match: draw lines word ↔ meaning ──
  WORD_MEANING_MATCH: {
    engine: "match",
    name: "Word–Meaning Match",
    emoji: "🧭",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Match each word to its definition",
    exampleText: "ancient ↔ very old · rapid ↔ very fast",
    aiHint: "Each round has 3-5 pairs, each written as: word | meaning.",
    dataFields: [{ k: "task", label: "Instruction shown above the pairs", type: "text", ph: "Match each word to its meaning" }],
    fields: [
      { k: "pairs", label: "Pairs — one per line as: word | meaning", type: "pairs", ph: "ancient | very old\nrapid | very fast" },
    ],
    aiExample: [
      { pairs: [["ancient", "very old"], ["rapid", "very fast"], ["fragile", "easily broken"], ["generous", "happy to give"]] },
    ],
  },

  // ── WORD_IN_CONTEXT → mcq: pick the sentence that uses the word correctly ──
  WORD_IN_CONTEXT: {
    engine: "mcq",
    name: "Word in Context",
    emoji: "📖",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Choose the sentence that uses the word correctly",
    exampleText: "“borrow” → “Can I borrow your pen?” (not “Can I borrow you my pen?”)",
    aiHint: "'sub' names the word being tested. 'options' are full sentences (keep 'stack' on so they list vertically). 'answer' is the sentence that uses the word correctly.",
    fields: [
      { k: "sub", label: "Instruction tag (name the word)", type: "text", ph: "Which sentence uses “borrow” correctly?" },
      { k: "options", label: "Sentences — one per line", type: "lines", ph: "Can I borrow your pen?\nCan I borrow you my pen?\nI borrow you yesterday." },
      { k: "answer", label: "Correct sentence (must equal one option)", type: "text", ph: "Can I borrow your pen?" },
      { k: "explain", label: "Why? Shown after answering (optional)", type: "text" },
      { k: "stack", label: "Stack options vertically (recommended for sentences)", type: "bool" },
    ],
    aiExample: [
      { sub: "Which sentence uses “borrow” correctly?", options: ["Can I borrow your pen?", "Can I borrow you my pen?", "I borrow you yesterday.", "He borrows happy."], answer: "Can I borrow your pen?", stack: true, explain: "“borrow” means to take and use something you'll give back." },
    ],
  },

  // ── ODD_ONE_OUT → mcq: pick the word that doesn't belong ──
  ODD_ONE_OUT: {
    engine: "mcq",
    name: "Odd One Out",
    emoji: "🚫",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Pick the word that doesn't belong with the others",
    exampleText: "apple, banana, carrot, mango → carrot (it's a vegetable)",
    aiHint: "'options' is a group of words that share a category except one. 'answer' is the odd word. Keep 'stack' on. 'explain' names the shared category.",
    fields: [
      { k: "sub", label: "Instruction tag", type: "text", ph: "Which word does NOT belong?" },
      { k: "options", label: "Words — one per line (all but one share a category)", type: "lines", ph: "apple\nbanana\ncarrot\nmango" },
      { k: "answer", label: "The odd word (must equal one option)", type: "text", ph: "carrot" },
      { k: "explain", label: "Why? Shown after answering (optional)", type: "text", ph: "“carrot” is a vegetable; the others are fruits." },
      { k: "stack", label: "Stack options vertically", type: "bool" },
    ],
    aiExample: [
      { sub: "Which word does NOT belong?", options: ["apple", "banana", "carrot", "mango"], answer: "carrot", explain: "“carrot” is a vegetable; the others are fruits.", stack: true },
    ],
  },

  // ── COLLOCATION_BUILDER → mcq: pick the word that naturally pairs ──
  COLLOCATION_BUILDER: {
    engine: "mcq",
    name: "Collocation Builder",
    emoji: "🔗",
    kind: "rounds",
    cats: ["vocabulary"],
    blurb: "Pick the word that naturally goes with the base word",
    exampleText: "make ___ → a decision (not “do a decision”)",
    aiHint: "'prompt' is the base word/phrase. 'options' are candidate partners; 'answer' is the one that forms a natural collocation.",
    fields: [
      { k: "sub", label: "Instruction tag", type: "text", ph: "Which word goes with “make”?" },
      { k: "prompt", label: "Base word / phrase (shown large)", type: "text", ph: "make" },
      { k: "options", label: "Answer choices (one per line)", type: "lines", ph: "a decision\na homework\na travel\na sport" },
      { k: "answer", label: "Correct partner (must equal one option)", type: "text", ph: "a decision" },
      { k: "explain", label: "Why? Shown after answering (optional)", type: "text", ph: "“make a decision” is the natural pairing." },
    ],
    aiExample: [
      { sub: "Which word goes with “make”?", prompt: "make", options: ["a decision", "a homework", "a travel", "a sport"], answer: "a decision", explain: "“make a decision” is the natural pairing." },
    ],
  },

  // ══════════════════════════ GRAMMAR ══════════════════════════

  // ── SENTENCE_BUILDER → order (words): drag word chips into a correct sentence ──
  SENTENCE_BUILDER: {
    engine: "order",
    name: "Sentence Builder",
    emoji: "🏗️",
    kind: "rounds",
    cats: ["grammar"],
    blurb: "Drag the word chips into the correct order to build a sentence",
    exampleText: "Build → “She is reading a book”",
    aiHint: "'answer' is the full correct sentence; it is split into word chips to reorder. Keep chip type on 'words'.",
    dataFields: [{ k: "mode", label: "Chip type", type: "select", opts: ["words", "letters"] }],
    fields: [
      { k: "hint", label: "Hint tag (optional)", type: "text", ph: "Put the words in order" },
      { k: "answer", label: "Correct sentence", type: "text", ph: "She is reading a book" },
      { k: "fragments", label: "Phrase chips, one per line (optional — overrides the word split)", type: "lines" },
      { k: "explain", label: "Note shown after answering (optional)", type: "text" },
    ],
    aiExample: [
      { hint: "Put the words in order", answer: "She is reading a book" },
      { hint: "Make a question", answer: "Where do you live" },
    ],
  },

  // ── ERROR_SPOTTING → tapword: tap the wrong word, then choose the fix ──
  ERROR_SPOTTING: {
    engine: "tapword",
    name: "Error Spotting",
    emoji: "🔎",
    kind: "rounds",
    cats: ["grammar"],
    blurb: "Tap the incorrect word in the sentence, then pick the correction",
    exampleText: "“She go to school.” → tap “go”, fix → goes",
    aiHint: "'words' is the sentence split into words. 'errorIndex' is the 0-based position of the wrong word. 'correction' must be one of 'corrections'.",
    fields: [
      { k: "words", label: "Sentence (words separated by spaces)", type: "words", ph: "She go to school every day." },
      { k: "errorIndex", label: "Position of the wrong word (first word = 0)", type: "number", ph: "1" },
      { k: "corrections", label: "Correction options (one per line)", type: "lines", ph: "goes\ngoing\ngone" },
      { k: "correction", label: "Correct fix (must equal one option)", type: "text", ph: "goes" },
      { k: "explain", label: "Why? Shown after answering", type: "text", ph: "Third-person singular adds -s." },
    ],
    aiExample: [
      { words: ["She", "go", "to", "school", "every", "day."], errorIndex: 1, corrections: ["goes", "going", "gone"], correction: "goes", explain: "Third-person singular adds -s: “she goes”." },
      { words: ["They", "is", "very", "happy", "today."], errorIndex: 1, corrections: ["are", "am", "be"], correction: "are", explain: "The plural subject “they” takes “are”." },
    ],
  },

  // ── VERB_CONJUGATION → fillblank: pick/type the correctly conjugated verb ──
  VERB_CONJUGATION: {
    engine: "fillblank",
    name: "Verb Conjugation",
    emoji: "🔄",
    kind: "rounds",
    cats: ["grammar"],
    blurb: "Choose or type the correctly conjugated verb for each pronoun and tense",
    exampleText: "to go — Present · “He ___ to work.” → goes",
    aiHint: "Each round conjugates one verb for one pronoun/tense. 'task' names the verb + tense; 'text' has the pronoun and ___; 'answer' is the conjugated form; 'options' are choices.",
    fields: [
      { k: "task", label: "Verb + tense (shown as a tag)", type: "text", ph: "to go — Present simple" },
      { k: "text", label: "Sentence with ___ (include the pronoun)", type: "text", ph: "He ___ to work every day." },
      { k: "options", label: "Options, one per line (empty = typed answer)", type: "lines", ph: "goes\ngo\ngoing\ngone" },
      { k: "answer", label: "Correct conjugated form", type: "text", ph: "goes" },
      { k: "rule", label: "Rule card shown after answering (optional)", type: "text", ph: "Third-person singular adds -s." },
      { k: "explain", label: "Why? (optional)", type: "text" },
    ],
    aiExample: [
      { task: "to go — Present simple", text: "He ___ to work every day.", options: ["goes", "go", "going", "gone"], answer: "goes", rule: "Third-person singular (he/she/it) adds -s." },
      { task: "to be — Past simple", text: "They ___ at home yesterday.", options: ["were", "was", "are", "been"], answer: "were", rule: "Plural subjects use “were” in the past." },
    ],
  },

  // ── MULTIPLE_CHOICE_GRAMMAR → mcq: choose the grammatically correct option ──
  MULTIPLE_CHOICE_GRAMMAR: {
    engine: "mcq",
    name: "Grammar Multiple Choice",
    emoji: "☑️",
    kind: "rounds",
    cats: ["grammar"],
    blurb: "Read the sentence and choose the grammatically correct option",
    exampleText: "“She ___ to school every day.” → goes / go / going / gone",
    aiHint: "Each round is one grammar question. 'prompt' is the sentence/question, 'options' the choices, 'answer' the correct one. Keep 'stack' on for full sentences.",
    fields: [
      { k: "sub", label: "Instruction tag", type: "text", ph: "Choose the correct answer" },
      { k: "prompt", label: "Question or sentence", type: "text", ph: "She ___ to school every day." },
      { k: "options", label: "Options (one per line)", type: "lines", ph: "goes\ngo\ngoing\ngone" },
      { k: "answer", label: "Correct answer (must equal one option)", type: "text", ph: "goes" },
      { k: "explain", label: "Why? Shown after answering", type: "text", ph: "Present simple, third person singular: goes." },
      { k: "stack", label: "Stack options vertically (for sentences)", type: "bool" },
    ],
    aiExample: [
      { sub: "Choose the correct answer", prompt: "She ___ to school every day.", options: ["goes", "go", "going", "gone"], answer: "goes", explain: "Present simple, third person singular: goes.", stack: true },
    ],
  },

  // ── QUIZ → mcq: general question + 4 options + explanation ──
  QUIZ: {
    engine: "mcq",
    name: "Quiz",
    emoji: "❓",
    kind: "rounds",
    cats: ["grammar"],
    blurb: "Answer multiple-choice questions, with an explanation after each",
    exampleText: "“Which word is a noun?” → happiness / quickly / bright / run",
    aiHint: "Each round is one question with a short explanation of the correct answer. Keep 'stack' on for long options/sentences.",
    fields: [
      { k: "sub", label: "Instruction tag", type: "text", ph: "Answer the question" },
      { k: "prompt", label: "Question", type: "text", ph: "Which of these words is a noun?" },
      { k: "options", label: "Options (one per line)", type: "lines", ph: "happiness\nquickly\nbright\nrun" },
      { k: "answer", label: "Correct answer (must equal one option)", type: "text", ph: "happiness" },
      { k: "explain", label: "Why? Shown after answering", type: "text" },
      { k: "stack", label: "Stack options vertically (for sentences)", type: "bool" },
    ],
    aiExample: [
      { sub: "Answer the question", prompt: "Which of these words is a noun?", options: ["happiness", "quickly", "bright", "run"], answer: "happiness", explain: "“Happiness” is a noun; the others are an adverb, an adjective, and a verb.", stack: true },
    ],
  },

  // ── DRAG_DROP → match: match each item to its category / partner ──
  DRAG_DROP: {
    engine: "match",
    name: "Drag & Drop Match",
    emoji: "🧩",
    kind: "rounds",
    cats: ["grammar"],
    blurb: "Match each item to its correct category or partner",
    exampleText: "run → Verb · happy → Adjective · quickly → Adverb",
    aiHint: "Each round has 3-5 pairs; each pair is [item, category].",
    dataFields: [{ k: "task", label: "Instruction shown above the pairs", type: "text", ph: "Match each word to its part of speech" }],
    fields: [
      { k: "pairs", label: "Pairs — one per line as: item | category", type: "pairs", ph: "run | Verb\nhappy | Adjective" },
    ],
    aiExample: [
      { pairs: [["run", "Verb"], ["happy", "Adjective"], ["quickly", "Adverb"], ["dog", "Noun"]] },
    ],
  },

  // ── TRANSFORMATION → texttask: rewrite the sentence following the instruction ──
  TRANSFORMATION: {
    engine: "texttask",
    name: "Sentence Transformation",
    emoji: "🔀",
    kind: "rounds",
    cats: ["grammar"],
    blurb: "Rewrite each sentence to follow the instruction",
    exampleText: "Make negative: “She likes coffee.” → “She doesn’t like coffee.”",
    aiHint: "'answers' lists all accepted variants (punctuation and case are ignored when checking).",
    fields: [
      { k: "instruction", label: "Instruction (shown as a tag)", type: "text", ph: "Make this sentence negative" },
      { k: "prompt", label: "Sentence to transform", type: "text", ph: "She likes coffee." },
      { k: "answers", label: "Accepted answers (one per line)", type: "lines", ph: "She doesn't like coffee\nShe does not like coffee" },
      { k: "explain", label: "Why? (optional)", type: "text" },
    ],
    aiExample: [
      { instruction: "Make this sentence negative", prompt: "She likes coffee.", answers: ["She doesn't like coffee", "She does not like coffee"], explain: "Present simple negative: doesn't + base verb." },
      { instruction: "Change to a question", prompt: "They are playing football.", answers: ["Are they playing football?", "Are they playing football"], explain: "Invert the subject and “to be” to form a question." },
    ],
  },

  // ══════════════════════════ LISTENING ══════════════════════════

  // ── DICTATION → texttask: hear a sentence, type it back ──
  DICTATION: {
    engine: "texttask",
    name: "Dictation",
    emoji: "🎧",
    kind: "rounds",
    cats: ["listening"],
    blurb: "Listen to the sentence and type exactly what you hear",
    exampleText: "🔊 “The train leaves at nine.” → type it back",
    aiHint: "'audioText' is read aloud; 'answers' lists accepted spellings of the same sentence.",
    fields: [
      { k: "instruction", label: "Instruction (shown as a tag)", type: "text", ph: "Listen and type what you hear" },
      { k: "audioText", label: "Audio text — read aloud (🔊)", type: "text", ph: "The train leaves at nine." },
      { k: "maxReplays", label: "Max audio replays (optional)", type: "number", ph: "3" },
      { k: "answers", label: "Accepted answers (one per line)", type: "lines", ph: "The train leaves at nine." },
      { k: "explain", label: "Why? (optional)", type: "text" },
    ],
    aiExample: [
      { instruction: "Listen and type what you hear", audioText: "The train leaves at nine.", answers: ["The train leaves at nine."] },
      { instruction: "Listen and type what you hear", audioText: "She bought two red apples.", answers: ["She bought two red apples."] },
    ],
  },

  // ── LISTEN_FILL_WORD → fillblank (audio): hear the sentence, fill the gap ──
  LISTEN_FILL_WORD: {
    engine: "fillblank",
    name: "Listen & Fill the Word",
    emoji: "🎧",
    kind: "rounds",
    cats: ["listening"],
    blurb: "Listen to the sentence, then fill in the missing word",
    exampleText: "🔊 “I drink ___ every morning.” → coffee",
    aiHint: "'text' has the sentence with ___; 'answer' fills it; 'audioText' plays the full sentence; 'options' are choices.",
    fields: [
      { k: "task", label: "Instruction tag (optional)", type: "text", ph: "Listen, then fill the gap" },
      { k: "text", label: "Sentence with ___ as the blank", type: "text", ph: "I drink ___ every morning." },
      { k: "audioText", label: "Audio text — the full sentence read aloud (🔊)", type: "text", ph: "I drink coffee every morning." },
      { k: "options", label: "Options, one per line (empty = typed answer)", type: "lines", ph: "coffee\ntea\nwater\njuice" },
      { k: "answer", label: "Correct answer", type: "text", ph: "coffee" },
      { k: "maxReplays", label: "Max audio replays (optional)", type: "number", ph: "3" },
      { k: "explain", label: "Why? (optional)", type: "text" },
    ],
    aiExample: [
      { task: "Listen, then fill the gap", text: "I drink ___ every morning.", audioText: "I drink coffee every morning.", options: ["coffee", "tea", "water", "juice"], answer: "coffee" },
    ],
  },

  // ── LISTEN_FILL_SENTENCE → texttask: hear a whole sentence, type it ──
  LISTEN_FILL_SENTENCE: {
    engine: "texttask",
    name: "Listen & Type the Sentence",
    emoji: "🎧",
    kind: "rounds",
    cats: ["listening"],
    blurb: "Listen to the whole sentence, then type it out",
    exampleText: "🔊 “Could you help me, please?” → type the sentence",
    aiHint: "'audioText' is read aloud; 'answers' lists accepted spellings of the sentence.",
    fields: [
      { k: "instruction", label: "Instruction (shown as a tag)", type: "text", ph: "Listen, then type the sentence" },
      { k: "audioText", label: "Audio text — read aloud (🔊)", type: "text", ph: "Could you help me, please?" },
      { k: "maxReplays", label: "Max audio replays (optional)", type: "number", ph: "3" },
      { k: "answers", label: "Accepted answers (one per line)", type: "lines", ph: "Could you help me, please?\nCould you help me please" },
      { k: "explain", label: "Why? (optional)", type: "text" },
    ],
    aiExample: [
      { instruction: "Listen, then type the sentence", audioText: "Could you help me, please?", answers: ["Could you help me, please?", "Could you help me please"] },
    ],
  },

  // ── SPEED_ROUND → mcq (audio): hear a word, pick it fast ──
  SPEED_ROUND: {
    engine: "mcq",
    name: "Speed Round",
    emoji: "⚡",
    kind: "rounds",
    cats: ["listening"],
    blurb: "Listen and pick the right word as fast as you can",
    exampleText: "🔊 “apple” → apple / orange / banana / grape",
    aiHint: "'audioText' plays the target word; 'options' include it plus distractors; 'answer' is the word played.",
    fields: [
      { k: "sub", label: "Instruction tag", type: "text", ph: "Quick — pick the word" },
      { k: "audioText", label: "Audio text — the word read aloud (🔊)", type: "text", ph: "apple" },
      { k: "options", label: "Options (one per line)", type: "lines", ph: "apple\norange\nbanana\ngrape" },
      { k: "answer", label: "Correct answer (must equal one option)", type: "text", ph: "apple" },
      { k: "explain", label: "Why? (optional)", type: "text" },
    ],
    aiExample: [
      { sub: "Quick — pick the word", audioText: "apple", options: ["apple", "orange", "banana", "grape"], answer: "apple" },
    ],
  },

  // ── MINIMAL_PAIR → mcq (audio): distinguish two similar-sounding words ──
  MINIMAL_PAIR: {
    engine: "mcq",
    name: "Minimal Pairs",
    emoji: "👂",
    kind: "rounds",
    cats: ["listening"],
    blurb: "Listen and choose which similar-sounding word you heard",
    exampleText: "🔊 → ship / sheep",
    aiHint: "'audioText' plays one word; 'options' are the two similar-sounding words; 'answer' is the one played.",
    fields: [
      { k: "sub", label: "Instruction tag", type: "text", ph: "Which word do you hear?" },
      { k: "audioText", label: "Audio text — the word read aloud (🔊)", type: "text", ph: "ship" },
      { k: "options", label: "The two similar words (one per line)", type: "lines", ph: "ship\nsheep" },
      { k: "answer", label: "Correct answer (the word played)", type: "text", ph: "ship" },
      { k: "explain", label: "Why? (optional)", type: "text" },
    ],
    aiExample: [
      { sub: "Which word do you hear?", audioText: "ship", options: ["ship", "sheep"], answer: "ship" },
    ],
  },

  // ══════════════════════════ WRITING ══════════════════════════

  // ── STORY → writing: creative story/paragraph from a guided prompt ──
  STORY: {
    engine: "writing",
    name: "Story Builder",
    emoji: "📖",
    kind: "data",
    cats: ["writing"],
    blurb: "Write a short story or paragraph from a guided prompt, with a live checklist",
    exampleText: "Prompt: “Write about your last holiday…” + word bank",
    aiHint: "'prompt' is the writing task. Optional 'wordBank' words appear as chips; 'starter' pre-fills the opening. 'rules' drive the checklist (minWords/minSentences/includes/startsWith/endsWith).",
    fields: [
      { k: "prompt", label: "Writing prompt", type: "textarea", ph: "Write about your last holiday. Include where you went, who with, and what you did." },
      { k: "wordBank", label: "Word bank (one per line, optional)", type: "lines", ph: "visited\nbeautiful\nrelaxing\nenjoyed" },
      { k: "starter", label: "Sentence starter (optional)", type: "text", ph: "Last summer, I" },
      { k: "note", label: "Note to the student (optional)", type: "text" },
      { k: "rules", label: "Rubric rules — one per line as: op | a | b", type: "rules", ph: "minWords | 40\nminSentences | 3\nincludes | visited, beautiful, relaxing | 2" },
    ],
    aiExample: {
      prompt: "Write about your last holiday. Include where you went, who you were with, and what you did.",
      wordBank: ["visited", "beautiful", "relaxing", "enjoyed"],
      starter: "Last summer, I",
      rules: [{ op: "minWords", a: "40" }, { op: "minSentences", a: "3" }, { op: "includes", a: "visited, beautiful, relaxing, enjoyed", b: "2" }],
    },
  },

  // ── WRITING_RUBRIC → writing: guided writing graded against a visible rubric ──
  WRITING_RUBRIC: {
    engine: "writing",
    name: "Writing with Rubric",
    emoji: "✍️",
    kind: "data",
    cats: ["writing"],
    blurb: "Guided writing with a live rubric checklist the student sees tick off",
    exampleText: "Prompt + checklist: ≥3 sentences, use 3 of: visited, delicious, beautiful",
    aiHint: "'prompt' is the task. 'rules' drive the live checklist (minWords/minSentences/includes/startsWith/endsWith). Set 'teacherReview' if a teacher also grades it.",
    fields: [
      { k: "prompt", label: "Writing prompt", type: "textarea", ph: "Describe your last holiday." },
      { k: "wordBank", label: "Word bank (one per line, optional)", type: "lines", ph: "visited\ndelicious\nbeautiful" },
      { k: "note", label: "Note to the student (optional)", type: "text" },
      { k: "teacherReview", label: "Also send to teacher for review", type: "bool" },
      { k: "rules", label: "Rubric rules — one per line as: op | a | b", type: "rules", ph: "minWords | 30\nminSentences | 3\nincludes | visited, delicious, beautiful | 3" },
    ],
    aiExample: {
      prompt: "Describe your last holiday — where you went and what made it special.",
      wordBank: ["visited", "delicious", "beautiful"],
      teacherReview: true,
      rules: [{ op: "minWords", a: "30" }, { op: "minSentences", a: "3" }, { op: "includes", a: "visited, delicious, beautiful", b: "3" }],
    },
  },

  // ── FILL_BLANK → writing: rewrite/improve given sentences ──
  FILL_BLANK: {
    engine: "writing",
    name: "Fill & Rewrite",
    emoji: "✏️",
    kind: "data",
    cats: ["writing"],
    blurb: "Rewrite the given sentences to make them clearer or more descriptive",
    exampleText: "Before: “The cat is big.” → rewrite more vividly",
    aiHint: "'prompt' lists the sentence(s) to rewrite/improve. 'rules' set minimums. Usually teacher-reviewed.",
    fields: [
      { k: "prompt", label: "Sentences to rewrite (what the student improves)", type: "textarea", ph: "Rewrite each sentence to make it clearer and more descriptive:\n\n1. The cat is big.\n2. The food was good." },
      { k: "starter", label: "Sentence starter (optional)", type: "text" },
      { k: "note", label: "Note to the student (optional)", type: "text" },
      { k: "teacherReview", label: "Send to teacher for review", type: "bool" },
      { k: "rules", label: "Rubric rules — one per line as: op | a | b", type: "rules", ph: "minWords | 20\nminSentences | 2" },
    ],
    aiExample: {
      prompt: "Rewrite each sentence to make it clearer and more descriptive:\n\n1. The cat is big.\n2. The food was good.",
      teacherReview: true,
      rules: [{ op: "minWords", a: "20" }, { op: "minSentences", a: "2" }],
    },
  },

  // ══════════════════════════ SPEAKING ══════════════════════════

  // ── SPEAK_FILL_WORD → speaking "gap": hear the sentence, then SAY the missing word ──
  SPEAK_FILL_WORD: {
    engine: "speaking",
    name: "Speak & Fill Word",
    emoji: "🎙️",
    kind: "rounds",
    cats: ["speaking"],
    blurb: "Hear the sentence, then speak the missing word aloud (scored by the mic)",
    exampleText: "🔊 → “I ___ to school every day.” → say “go”",
    aiHint: "'display' is the sentence with a ___ gap the student sees; 'audioText' is the FULL sentence read aloud (🔊); 'target' is the single word the student must say. Scored by speech similarity to 'target'.",
    fields: [
      { k: "task", label: "Instruction tag", type: "text", ph: "Listen, then say the missing word" },
      { k: "display", label: "Sentence with a gap (shown on screen)", type: "text", ph: "I ___ to school every day." },
      { k: "audioText", label: "Full sentence read aloud (🔊)", type: "text", ph: "I go to school every day." },
      { k: "target", label: "The word the student must say", type: "text", ph: "go" },
      { k: "note", label: "Note to the student (optional)", type: "text" },
    ],
    aiExample: [
      { mode: "gap", task: "Listen, then say the missing word", display: "I ___ to school every day.", audioText: "I go to school every day.", target: "go" },
    ],
  },

  // ── SPEAK_FILL_SENTENCE → speaking "repeat": hear a sentence, then SAY the whole thing ──
  SPEAK_FILL_SENTENCE: {
    engine: "speaking",
    name: "Speak & Complete",
    emoji: "🗣️",
    kind: "rounds",
    cats: ["speaking"],
    blurb: "Hear a sentence, then say the whole sentence aloud (scored by the mic)",
    exampleText: "🔊 → say “The weather is beautiful today.”",
    aiHint: "'audioText' is the sentence read aloud (🔊); 'display' shows the same sentence for support; 'target' is the expected speech (the full sentence). Scored by speech similarity to 'target'.",
    fields: [
      { k: "task", label: "Instruction tag", type: "text", ph: "Listen, then say the whole sentence" },
      { k: "audioText", label: "Sentence read aloud (🔊)", type: "text", ph: "The weather is beautiful today." },
      { k: "display", label: "Sentence shown on screen (support)", type: "text", ph: "The weather is beautiful today." },
      { k: "target", label: "Expected speech (for scoring)", type: "text", ph: "The weather is beautiful today." },
      { k: "note", label: "Note to the student (optional)", type: "text" },
    ],
    aiExample: [
      { mode: "repeat", task: "Listen, then say the whole sentence", audioText: "The weather is beautiful today.", display: "The weather is beautiful today.", target: "The weather is beautiful today." },
    ],
  },
};

// ── Resolve the schema for an app GAME_TYPE ──
// Prefer a per-TYPE schema when one exists (concept-specific builder), otherwise fall
// back to the shared per-ENGINE schema. Either way the returned schema's `engine`
// matches folderEngineForType(type), so preview and real play use the same engine.
export function schemaForType(type: string): BuilderSchema {
  const perType = TYPE_SCHEMAS[type];
  if (perType) return perType;
  const engine = folderEngineForType(type);
  return BUILDER_SCHEMAS[engine] || BUILDER_SCHEMAS.mcq;
}

// ── form value -> engine data (per field type) ──
// Faithful port of reference parseField.
export function parseField(f: SchemaField, v: any): any {
  const lines = () =>
    String(v ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  const split = (l: string) => l.split("|").map((s) => s.trim());
  switch (f.type) {
    case "lines": {
      const a = lines();
      return a.length ? a : undefined;
    }
    case "pairs":
      return lines().map((l) => {
        const p = split(l);
        return [p[0], p[1] || ""];
      });
    case "defs":
      return Object.fromEntries(
        lines().map((l) => {
          const p = split(l);
          return [p[0], p[1] || ""];
        })
      );
    case "items":
      return lines().map((l) => {
        const p = split(l);
        return { word: p[0], cat: p[1] || "" };
      });
    case "entries":
      return lines().map((l) => {
        const p = split(l);
        return {
          word: (p[0] || "").toUpperCase(),
          clue: p[1] || "",
          row: parseInt(p[2], 10) || 0,
          col: parseInt(p[3], 10) || 0,
          dir: p[4] === "down" ? "down" : "across",
        };
      });
    case "rules":
      return lines().map((l) => {
        const p = split(l);
        return { op: p[0], a: p[1] || "", b: p[2] || "" };
      });
    case "dialogue": {
      // One line per turn, encoded as: A/B | speaker name | text
      // (A = left / other person, B = right / the learner; put ___ where the blank goes)
      const arr = lines().map((l) => {
        const p = l.split("|");
        const side = (p[0] || "").trim().toUpperCase() === "B" ? "B" : "A";
        const name = (p[1] || "").trim();
        const line = p.slice(2).join("|").trim();
        return { s: side, name, line };
      }).filter((d) => d.name || d.line);
      return arr.length ? arr : undefined;
    }
    case "cards": {
      // One card per line, encoded as: word | meaning | hint (opt) | example (opt)
      const arr = lines().map((l) => {
        const p = split(l);
        return {
          front: p[0] || "",
          back: p[1] || "",
          hint: p[2] || undefined,
          example: p[3] || undefined,
        };
      }).filter((c) => c.front || c.back);
      return arr.length ? arr : undefined;
    }
    case "words":
      return String(v ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    case "number":
      return String(v ?? "").trim() === "" ? undefined : parseInt(v, 10);
    case "bool":
      return v ? true : undefined;
    default:
      return String(v ?? "").trim() === "" ? undefined : String(v).trim();
  }
}

// ── engine data -> form value (inverse of parseField). Port of reference toForm. ──
export function toForm(f: SchemaField, v: any): any {
  if (v === undefined || v === null) return f.type === "bool" ? false : "";
  switch (f.type) {
    case "lines":
      return Array.isArray(v) ? v.join("\n") : String(v);
    case "pairs":
      return (v as any[]).map((p) => p.join(" | ")).join("\n");
    case "defs":
      return Object.entries(v as Record<string, any>)
        .map((p) => p.join(" | "))
        .join("\n");
    case "items":
      return (v as any[]).map((it) => `${it.word} | ${it.cat}`).join("\n");
    case "entries":
      return (v as any[]).map((e) => [e.word, e.clue, e.row, e.col, e.dir].join(" | ")).join("\n");
    case "rules":
      return (v as any[])
        .map((r) => [r.op, r.a, r.b].filter((x) => x !== undefined && x !== "").join(" | "))
        .join("\n");
    case "dialogue":
      return Array.isArray(v)
        ? (v as any[]).map((d) => [d.s || "A", d.name || "", d.line || ""].join(" | ")).join("\n")
        : String(v);
    case "cards":
      return Array.isArray(v)
        ? (v as any[]).map((c) => {
            const cols = [c.front || "", c.back || "", c.hint || "", c.example || ""];
            while (cols.length > 2 && !cols[cols.length - 1]) cols.pop(); // drop trailing empty optional cols
            return cols.join(" | ");
          }).join("\n")
        : String(v);
    case "words":
      return Array.isArray(v) ? v.join(" ") : String(v);
    case "bool":
      return !!v;
    default:
      return String(v);
  }
}

export type FormValues = Record<string, any>;

export const emptyValues = (fields: SchemaField[]): FormValues =>
  Object.fromEntries(fields.map((f) => [f.k, f.type === "bool" ? false : ""]));

export const dataToForm = (fields: SchemaField[], data: any): FormValues =>
  Object.fromEntries(fields.map((f) => [f.k, toForm(f, data ? data[f.k] : undefined)]));

// Ensure select fields default to their first option when empty.
function withSelectDefaults(fields: SchemaField[], values: FormValues): FormValues {
  const out = { ...values };
  fields.forEach((f) => {
    if (f.type === "select" && (!out[f.k] || out[f.k] === "")) out[f.k] = f.opts?.[0] ?? "";
  });
  return out;
}

// ── form values (dataVals + rounds) -> engine-ready `data`. Port of parseGameData. ──
export function parseGameData(schema: BuilderSchema, dataVals: FormValues, rounds: FormValues[]): Record<string, any> {
  if (schema.kind === "rounds") {
    const data: Record<string, any> = {
      rounds: (rounds || []).map((r) => {
        const obj: Record<string, any> = {};
        schema.fields.forEach((f) => {
          const v = parseField(f, r[f.k]);
          if (v !== undefined) obj[f.k] = v;
        });
        return obj;
      }),
    };
    (schema.dataFields || []).forEach((f) => {
      const v = parseField(f, dataVals[f.k]);
      if (v !== undefined) data[f.k] = v;
    });
    return data;
  }
  const data: Record<string, any> = {};
  schema.fields.forEach((f) => {
    const v = parseField(f, dataVals[f.k]);
    if (v !== undefined) data[f.k] = v;
  });
  return data;
}

// ── Convenience wrappers keyed by app GAME_TYPE ──

/** Build engine-ready `data` for a game type from the builder form state. */
export function buildEngineData(type: string, dataVals: FormValues, rounds: FormValues[]): Record<string, any> {
  return parseGameData(schemaForType(type), dataVals, rounds);
}

/** Seed builder form state from existing engine `data` (edit / template flow). */
export function engineDataToForm(type: string, data: any): { dataVals: FormValues; rounds: FormValues[] } {
  const schema = schemaForType(type);
  if (schema.kind === "rounds") {
    const dataFields = schema.dataFields || [];
    const dataVals = withSelectDefaults(dataFields, dataToForm(dataFields, data));
    const srcRounds: any[] = data && Array.isArray(data.rounds) ? data.rounds : [];
    const rounds = srcRounds.length
      ? srcRounds.map((r) => withSelectDefaults(schema.fields, dataToForm(schema.fields, r)))
      : [withSelectDefaults(schema.fields, emptyValues(schema.fields))];
    return { dataVals, rounds };
  }
  const dataVals = withSelectDefaults(schema.fields, dataToForm(schema.fields, data));
  return { dataVals, rounds: [] };
}

/** Blank builder form state for a new game of this type. */
export function emptyForm(type: string): { dataVals: FormValues; rounds: FormValues[] } {
  const schema = schemaForType(type);
  if (schema.kind === "rounds") {
    const dataFields = schema.dataFields || [];
    return {
      dataVals: withSelectDefaults(dataFields, emptyValues(dataFields)),
      rounds: [withSelectDefaults(schema.fields, emptyValues(schema.fields))],
    };
  }
  return { dataVals: withSelectDefaults(schema.fields, emptyValues(schema.fields)), rounds: [] };
}

/** Example engine data for a type (from the schema's aiExample). */
export function exampleEngineData(type: string): Record<string, any> {
  const schema = schemaForType(type);
  const ex = schema.aiExample;
  if (schema.kind === "rounds") {
    const arr = Array.isArray(ex) ? ex : [ex];
    const data: Record<string, any> = { rounds: arr };
    // carry any dataField defaults present on the example's first round-sibling
    (schema.dataFields || []).forEach((f) => {
      if (f.type === "select") data[f.k] = f.opts?.[0];
    });
    return data;
  }
  return { ...ex };
}

/** Does this engine `data` hold real, previewable content? */
export function hasEngineContent(type: string, data: any): boolean {
  if (!data || typeof data !== "object") return false;
  const schema = schemaForType(type);
  if (schema.kind === "rounds") {
    const rounds: any[] = Array.isArray(data.rounds) ? data.rounds : [];
    return rounds.some((r) => r && Object.values(r).some((v) => v !== undefined && String(v).trim() !== ""));
  }
  return Object.values(data).some((v) => v !== undefined && String(v).trim() !== "");
}

/** Coarse signature so a preview host can reset when the shape meaningfully changes. */
export function previewSignature(type: string, data: any): string {
  const schema = schemaForType(type);
  if (schema.kind === "rounds") {
    const rounds: any[] = data && Array.isArray(data.rounds) ? data.rounds : [];
    return rounds.map((r) => Object.values(r).filter((v) => v !== undefined && String(v).trim() !== "").length).join(",");
  }
  return String(Object.values(data || {}).filter((v) => v !== undefined && String(v).trim() !== "").length);
}
