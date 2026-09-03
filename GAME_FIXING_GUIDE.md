# LingoKit — Game-Fixing Reference Guide

Hand this guide (or the relevant game block) to any AI/LLM to understand and fix a
specific game. It explains the **architecture**, the **files** involved, the **data
fields** each game uses, and the **game concept** — plus a ready-to-copy **prompt** you
can give the AI.

---

## How the games work (architecture — read this once)

Every game goes through the same pipeline. If an AI understands this, it can fix any game.

```
GamePlayer.tsx
  └─ buildFolderGame(type, settings, items)  → lib/folder-game-data.ts
       └─ returns FolderGame { engine, data }    (engine = "mcq" | "fillblank" | "flashcard" | ...)
            └─ FolderGame.tsx maps engine string → React component in components/games/engines/
                 └─ the engine uses GameShell + useGame (score/correct/total → onComplete)
```

**The 4 layers of any game:**

| Layer | Where | What it does |
|---|---|---|
| **Builder** (teacher input) | `components/dashboard/builders/*Builder.tsx` | The form the teacher uses to enter items. Produces `builderData` (e.g. `{ pairs }`, `{ sentenceItems }`). |
| **Storage** | `app/api/games/route.ts` + `app/api/games/[id]/route.ts` | Saves `builderData` into the game's `settings` JSON (and/or relational tables like `flashcardData`, `quizData`). |
| **Data builder** | `lib/folder-game-data.ts` → `buildFolderGame()` | Turns the game's `settings` + `items` into engine `data` (rounds/pairs/etc.). |
| **Engine** (playback) | `components/games/engines/*.tsx` | The actual game UI/logic shown to the student. |

Supporting files:
- **AI generation**: `lib/game-schemas.ts` (per-game Zod schema + prompt), `lib/generate-game.ts` (calls the AI), `lib/map-ai-data.ts` (maps AI JSON → builderData), `lib/adapt-generated-game.ts` (maps AI JSON → play items).
- **Previews**: `components/dashboard/GamePreviewImage.tsx` (static SVG shown on the game card) + `components/dashboard/GamePreviewModal.tsx` (the "Try the Game" modal).
- **Game catalog/metadata**: `lib/game-type-metadata.ts` (title, description, category, objectives, `vocabContentType`, `configFields`).
- **Guides**: `lib/game-guides.ts` (how-to-play text shown in the preview modal).

**Storage decision:** most content is stored in the game's `settings` JSON under a
per-game key (`settings.pairs`, `settings.sentenceItems`, `settings.synonymItems`, …).
Flashcard-type games ALSO write to the `flashcardData` relational model. The player
prefers `settings`/relational content and falls back to the plain word items.

---

## The game concept list (source of truth)

This is the intended concept for each game — use it to verify a game is correct.

| # | Game | Intended concept |
|---|---|---|
| 1 | Flashcard | Flip-card study deck: word on front, tap to reveal translation + example, self-grade "Know it / Don't know it". |
| 2 | Memory Match | Grid of face-down cards; flip two to match **synonym** pairs (word ↔ synonym); show meaning on match; timer + score + streak + match history. |
| 3 | Fill the Gap | English sentence with a blank; fill with the **English word** (options all English, never translation). |
| 4 | Synonym & Antonym | Shown a word, pick its synonym OR antonym from 3-4 options (random synonym/antonym round). |
| 5 | Situational Dialogue | Two-person conversation; one line has a blank; complete with the contextually correct **English** word/phrase. |
| 6 | Word Scramble | Letters of a word shuffled; tap/arrange into correct order. |
| 7 | Picture to Word | Image shown; pick/type the word it represents. |
| 8 | Category Sort | Drag words into correct category buckets. |
| 9 | Crossword | Classic crossword grid; clues are definitions; end-of-unit review. |
| 10 | Word & Meaning (match) | Match a word on the left to its definition on the right. |
| 11 | Sentence Builder | Arrange scrambled words into a correct sentence. |
| 12 | Error Spotting | Find the grammar mistake in a sentence and fix it. |
| 13 | Verb Conjugation | Fill the conjugated form for each pronoun in a given tense. |
| 14 | Multiple Choice Grammar / Quiz | Choose the grammatically correct option. |
| 15 | Dictation | Listen and type what you hear. |
| 16 | Listen & Fill / Order | Listen and fill the missing word / order the words. |
| 17 | Transformations | Rewrite a sentence as instructed (negative / past / question). |
| 18 | Writing (Story / Rubric / Fill & Rewrite) | Write a response to a prompt (optional rubric/word bank). |
| 19 | Speaking | Repeat / read / speak the gap using the mic. |

---

## ⭐ THE FILES TO TELL THE AI TO READ FOR ANY GAME

Before fixing any specific game, tell the AI to read these **two anchor files** first,
because they wire everything together:

1. `lib/folder-game-data.ts` — `folderEngineForType(type)` (which engine a type uses)
   and `buildFolderGame()` (how content becomes engine data).
2. `lib/game-type-metadata.ts` — the game's official `description`, `objectives`,
   `vocabContentType`, `configFields`.

Then read the game-specific files listed in that game's block below.

---

## Per-game reference

### 🃏 1. Flashcard  (`FLASHCARD`)
- **Concept:** flip-card deck; word front → tap → translation + example; "Know it ✓ / Don't know it ✗".
- **Builder:** `components/dashboard/builders/FlashcardPairBuilder.tsx` → produces `{ pairs }`, each `{ id, word, translation, exampleSentence, audioUrl, imageUrl }`.
- **Storage:** `settings` (+ `flashcardData.pairs` relational).
- **Engine:** `flashcard` → `components/games/engines/Flashcard.tsx`.
- **Data fields (engine round):** `{ word, translation, exampleSentence }`.
- **AI schema (`game-schemas.ts`):** `{ items: [{ word, translation, exampleSentence }] }`.
- **Preview:** `GamePreviewImage.tsx` (FLASHCARD case), `GamePreviewModal.tsx`.
- **Tell the AI:** "Flashcard = a flip-card study deck. Front shows the English word, tapping flips to reveal the translation + example sentence, with 'Know it / Don't know it' self-grading. Match the flip-card UI and the metadata description."

---

### 🧠 2. Memory Match  (`MEMORY`)
- **Concept:** flip two cards to match **synonym** pairs (word ↔ synonym); meaning shown on match; timer, score, streak bonus, match history. Reference project: `C:\Users\ASUS\Desktop\portofolio\MemoryBlocksGame` / https://github.com/DhiaEddine-Ouchene/Word-Matcher-Game.
- **Builder:** `FlashcardPairBuilder.tsx` → `{ pairs }` (second field = the **synonym**).
- **Storage:** `settings` (+ `flashcardData.pairs`).
- **Engine:** `memory` → `components/games/engines/MemoryMatch.tsx` (already a full port of the reference; re-themed).
- **Data fields:** `{ pairs: [[word, synonym]], defs: { word: meaning } }`.
- **AI schema:** `{ items: [{ word, synonym, antonym, exampleSentence }] }` (same as synonym).
- **Preview:** `GamePreviewImage.tsx` (MEMORY case), `GamePreviewModal.tsx`.
- **Tell the AI:** "Memory Match = the classic Word Matcher. Flip two cards to match synonym pairs; show the meaning in a Match History panel; timer + score with streak bonus (100→200→300) + moves + pairs-left. Keep it identical to the Word-Matcher-Game repo but re-themed to the app colors."

---

### 📝 3. Fill the Gap  (`FILL_GAP_WORD`)
- **Concept:** English sentence with `___`; fill the missing **English word** (options all English).
- **Builder:** `components/dashboard/builders/SentenceFillBuilder.tsx` → `{ sentenceItems }`, each `{ id, sentence, correctAnswer, options[3] }`.
- **Storage:** `settings.sentenceItems`.
- **Engine:** `fillblank` → `components/games/engines/FillBlank.tsx`.
- **Data fields (engine round):** `{ text (sentence with ___), options, answer }`.
- **AI schema:** `{ items: [{ sentenceWithBlank, correctWord, distractors }] }` — mapping reads `sentenceWithBlank`→sentence, `correctWord`→correctAnswer.
- **Preview:** `GamePreviewImage.tsx` (FILL_GAP_WORD case), `GamePreviewModal.tsx`.
- **Tell the AI:** "Fill the Gap: show an English sentence with a blank and English word options (never the student's native language). The gap is filled with the English word. No auto-generated default sentences in the builder."

---

### 🔤 4. Synonym & Antonym  (`SYNONYM_ANTONYM`)
- **Concept:** show a target word; pick its synonym OR antonym from 3-4 options (random mode per round).
- **Builder:** `components/dashboard/builders/SynonymAntonymBuilder.tsx` → `{ synonymItems }`, each `{ id, word, synonym, antonym }` (all three required).
- **Storage:** `settings.synonymItems`.
- **Engine:** `synonymantonym` → `components/games/engines/SynonymAntonym.tsx`.
- **Data fields (engine round):** `{ word, synonym, antonym }`.
- **AI schema:** `{ items: [{ word, synonym, antonym, distractors }] }`.
- **Preview:** `GamePreviewImage.tsx` (SYNONYM_ANTONYM case shows word + option buttons), `GamePreviewModal.tsx`.
- **Tell the AI:** "Show a target word and 3-4 option buttons. The student picks the synonym (green) or antonym (red) — mode chosen randomly per round. Options must always be English words, never empty."

---

### 💬 5. Situational Dialogue  (`SITUATION_DIALOGUE_FILL`)
- **Concept:** two-person conversation; one line has `___`; complete with the correct **English** word/phrase.
- **Builder:** `components/dashboard/builders/DialogueBuilder.tsx` → `{ dialogueItems }`, each `{ scenario, answer, options[3], lines: [{ name, s: "A"|"B", text }] }`.
- **Storage:** `settings.dialogueItems`.
- **Engine:** `fillblank` → `FillBlank.tsx` (dialogue branch in `folder-game-data.ts` `fillblankData`).
- **Data fields:** `{ task: scenario, dialogue: [{ s, name, line }], options, answer }`.
- **AI schema:** `{ items: [{ scenario, lines:[{speaker,text,isBlank}], blanks:[{lineIndex, correctAnswer, distractors}] }] }` — answers must be in the target language.
- **Preview:** `GamePreviewImage.tsx` (SITUATION_DIALOGUE_FILL case), `GamePreviewModal.tsx` (injects demo dialogue).
- **Tell the AI:** "Two-person conversation where one line has a blank. Student fills it with the correct English word from options. Answers/options must be English, never the translation. The dialogue lines and options should never show the native language."

---

### 🔀 6. Word Scramble  (`WORD_SCRAMBLE`)
- **Concept:** letters shuffled; arrange into the correct word.
- **Builder:** `FlashcardPairBuilder.tsx` → `{ pairs }`.
- **Storage:** `settings` (+ `flashcardData.pairs`).
- **Engine:** `order` → `components/games/engines/OrderChips.tsx` (mode `letters`).
- **Data fields:** `{ mode: "letters", rounds: [{ hint, answer }] }`.
- **AI schema:** `{ items: [{ word, hint }] }`.
- **Tell the AI:** "Word Scramble = letters mode. Each round shows a hint (translation or blanked sentence) and the scrambled letters; student arranges letters to spell the word."

---

### 🖼️ 7. Picture to Word  (`PICTURE_TO_WORD`)
- **Concept:** image shown → pick the matching word.
- **Builder:** `FlashcardPairBuilder.tsx` (includes an `ImageUpload`) → `{ pairs }` with `imageUrl`.
- **Storage:** `settings` (+ `flashcardData.pairs` — images live on the pairs).
- **Engine:** `mcq` → `components/games/engines/Mcq.tsx` (PICTURE_TO_WORD branch in `folder-game-data.ts` `mcqData`).
- **Data fields:** `{ sub, image, prompt, options, answer }` (image from `imageUrl`).
- **AI schema:** `{ items: [{ word, imageSearchTerm, distractors }] }`.
- **Preview:** `GamePreviewImage.tsx` (PICTURE_TO_WORD case), `GamePreviewModal.tsx`.
- **Tell the AI:** "Show the uploaded image; student picks the word it represents from options. Uploaded images must appear in both the builder preview and the game (carry `imageUrl` through)."

---

### 🗂️ 8. Category Sort  (`CATEGORY_SORT`)
- **Concept:** drag words into correct category buckets.
- **Builder:** `components/dashboard/builders/CategorySortBuilder.tsx` → `{ sortCategories, sortItems:[{word, category}] }`.
- **Storage:** `settings.sortCategories` + `settings.sortItems`.
- **Engine:** `sort` → `components/games/engines/CategorySort.tsx`.
- **Data fields:** `{ rounds: [{ categories, items: [{word, cat}] }] }`.
- **Tell the AI:** "Show a word and category buckets; student drops the word into the right bucket with instant feedback. Needs a valid builder (2+ categories, 3+ words) for Preview/Try to enable."

---

### 🔄 9. Crossword  (`CROSSWORD`)
- **Concept:** classic crossword grid; clues are definitions; end-of-unit review.
- **Builder:** `components/dashboard/builders/CrosswordGridBuilder.tsx` → `{ gridSize, words:[{word, clue, direction, row, col}] }`.
- **Storage:** `settings` (`crosswordData` relational, merged to `settings.crosswordWords`).
- **Engine:** `crossword` → `components/games/engines/Crossword.tsx`.
- **Data fields:** `{ entries: [{ word, clue, dir: "across"|"down", row, col }] }` — NOTE engine expects `dir`, builder emits `direction` (folder-game-data maps them).
- **AI schema:** `{ items: [{ word, clue }] }`.
- **Preview:** `GamePreviewImage.tsx` (CROSSWORD case), `GamePreviewModal.tsx`.
- **Tell the AI:** "Classic crossword grid. Clues list Across/Down; student types letters into numbered cells. Needs 2+ valid words for Preview/Try to enable, and the grid must render words in the correct positions."

---

### 🔗 10. Word & Meaning (drag-to-match)  (`DRAG_DROP`)
- **Concept:** match a word to its meaning/definition (two columns).
- **Builder:** `SentenceFillBuilder.tsx` → `{ sentenceItems }`.
- **Storage:** `settings.sentenceItems`.
- **Engine:** `match` → `components/games/engines/MatchPairs.tsx`.
- **Data fields:** `{ task, rounds: [{ pairs: [[word, meaning], ...] }] }`.
- **Tell the AI:** "Two-column matching: words on the left, meanings/definitions on the right; tap/drag to pair them. (This is the 'Word & Meaning' concept.)"

---

### 🏗️ 11. Sentence Builder  (`SENTENCE_BUILDER`)
- **Concept:** arrange scrambled words into a correct sentence.
- **Builder:** `SentenceFillBuilder.tsx` → `{ sentenceItems }`.
- **Storage:** `settings.sentenceItems`.
- **Engine:** `order` (mode `words`) → `OrderChips.tsx`.
- **Data fields:** `{ mode: "words", rounds: [{ hint, answer }] }`.
- **AI schema:** `{ items: [{ correctSentence }] }`.
- **Tell the AI:** "Sentence Builder = whole-word chips the student drags into the correct order to form a sentence."

---

### 🔎 12. Error Spotting  (`ERROR_SPOTTING`)
- **Concept:** find + fix the grammar mistake.
- **Builder:** `QuizQuestionBuilder.tsx` → `{ questions }`.
- **Storage:** `settings` (`quizData` relational, merged to `settings.questions`).
- **Engine:** `tapword` → `components/games/engines/TapWord.tsx`.
- **Data fields:** `{ rounds: [{ words, errorIndex, corrections, correction, explain }] }`.
- **AI schema:** `{ items: [{ sentenceWithError, wrongPart, correction, ruleExplanation }] }`.
- **Tell the AI:** "Show a sentence with an error; student taps the wrong word then fixes it. Case/punctuation-insensitive matching of the wrong word."

---

### 🔄 13. Verb Conjugation  (`VERB_CONJUGATION`)
- **Concept:** fill the conjugated form for each pronoun in a given tense.
- **Builder:** `components/dashboard/builders/VerbConjugationBuilder.tsx` → `{ verb, tense, forms }`.
- **Storage:** `settings` (`verbConjugationData` relational).
- **Engine:** `fillblank` → `FillBlank.tsx` (verb branch in `fillblankData`).
- **Data fields:** verb/tense/forms.
- **AI schema:** `{ verb, tense, forms:[{pronoun, form}] }`.
- **Tell the AI:** "Given a verb + tense, the student fills the conjugated form for each pronoun (I/you/he/we/they)."

---

### ☑️ 14. Multiple Choice Grammar / Quiz  (`MULTIPLE_CHOICE_GRAMMAR`, `QUIZ`)
- **Concept:** choose the grammatically correct option.
- **Builder:** `QuizQuestionBuilder.tsx` → `{ questions }` (prompt, options, correctAnswer, explanation).
- **Storage:** `settings` (`quizData` relational, merged to `settings.questions`).
- **Engine:** `mcq` → `Mcq.tsx`.
- **Data fields:** `{ rounds: [{ prompt, options, answer, explain }] }`.
- **AI schema:** `{ items: [{ question, options[4], correctOption, explanation }] }`.
- **Tell the AI:** "Standard multiple choice: a question/prompt with options; student picks the correct one."

---

### 🎧 15. Dictation  (`DICTATION`)
- **Concept:** listen and type exactly what you hear.
- **Builder:** `SentenceFillBuilder.tsx` → `{ sentenceItems }`.
- **Storage:** `settings.sentenceItems`.
- **Engine:** `texttask` → `components/games/engines/TextTask.tsx`.
- **Data fields:** `{ rounds: [{ instruction, prompt, answers }] }`.
- **AI schema:** `{ items: [{ sentence }] }`.
- **Tell the AI:** "Play audio; student types the exact sentence they hear. Audio comes from `settings.audioItems` or TTS."

---

### 🔊 16. Listen & Fill / Order  (`LISTEN_FILL_WORD`, `LISTEN_FILL_SENTENCE`)
- **Concept:** listen and fill the missing word / order the words.
- **Builder:** `SentenceFillBuilder.tsx` → `{ sentenceItems }`.
- **Storage:** `settings.sentenceItems` / `settings.audioItems`.
- **Engine:** `fillblank` (word) / `order` or `texttask` (sentence).
- **Tell the AI:** "Listening game: play audio, then the student fills the missing word (or orders/reties the sentence)."

---

### ⚡ 17. Listen & Select (Speed Round)  (`SPEED_ROUND`)
- **Concept:** listen and pick the right answer quickly.
- **Builder:** `FlashcardPairBuilder.tsx` → `{ pairs }`.
- **Storage:** `settings` (+ `flashcardData.pairs`).
- **Engine:** `mcq` → `Mcq.tsx`.
- **Tell the AI:** "Fast listening: play a word, show options, pick the right one before time runs out."

---

### ⚖️ 18. Minimal Pair  (`MINIMAL_PAIR`)
- **Concept:** hear similar sounds and identify which word was said.
- **Builder:** `FlashcardPairBuilder.tsx` → `{ pairs }` (wordA/wordB).
- **Storage:** `settings` (+ `flashcardData.pairs`).
- **Engine:** `mcq` → `Mcq.tsx`.
- **AI schema:** `{ items: [{ wordA, wordB }] }`.
- **Tell the AI:** "Two similar-sounding words (e.g. ship/sheep); play one, student picks which they heard."

---

### 🔁 19. Sentence Transformation  (`TRANSFORMATION`)
- **Concept:** rewrite a sentence as instructed (negative/past/question).
- **Builder:** `components/dashboard/builders/TransformationBuilder.tsx` → `{ transformationItems }`, each `{ instruction, prompt, answers }`.
- **Storage:** `settings.transformationItems`.
- **Engine:** `texttask` → `TextTask.tsx`.
- **Data fields:** `{ rounds: [{ instruction, prompt, answers }] }`.
- **Tell the AI:** "Show a sentence + instruction (make negative / change to past / ask a question); accept a few correct variants."

---

### ✍️ 20. Writing  (`STORY`, `WRITING_RUBRIC`, `FILL_BLANK`)
- **Concept:** write a response to a prompt (Story / Rubric / Fill & Rewrite).
- **Builder:** `StoryPromptBuilder.tsx` (STORY), `WritingBuilder.tsx` (WRITING_RUBRIC), `SentenceFillBuilder.tsx` (FILL_BLANK).
- **Storage:** `settings` (`storyData` / `writingData` relational).
- **Engine:** `writing` → `components/games/engines/Writing.tsx`.
- **Data fields:** `{ prompt, wordBank, rules, starter, note }`.
- **Tell the AI:** "Open writing task: a prompt (and optional word bank / rubric checklist); student writes a response."

---

### 🎙️ 21. Speaking  (`SPEAKING`, `SPEAK_FILL_WORD`, `SPEAK_FILL_SENTENCE`)
- **Concept:** repeat / read / speak the gap using the microphone.
- **Builder:** `components/dashboard/builders/SpeakingBuilder.tsx` → `{ speakingItems }`.
- **Storage:** `settings.speakingItems`.
- **Engine:** `speaking` → `components/games/engines/Speaking.tsx`.
- **Data fields:** `{ rounds: [{ mode, display, target, keywords, note }] }`.
- **Tell the AI:** "Mic-based speaking with modes: repeat, read-aloud, speak-the-gap, roleplay (keywords), describe (teacher review)."

---

## Generic "fix this game" prompt template

Copy this and fill in the blanks for any game:

```
Fix the <GAME NAME> (<GAME TYPE CODE>) game in this Next.js/Prisma app.

First read these two anchor files to understand the wiring:
- lib/folder-game-data.ts  (folderEngineForType + buildFolderGame)
- lib/game-type-metadata.ts (official description/objectives for this game)

Then read this game's files:
- Builder: components/dashboard/builders/<Builder>.tsx
- Engine:  components/games/engines/<Engine>.tsx
- Data:    lib/folder-game-data.ts (the <...Data> function + buildFolderGame derived entry)
- AI:      lib/game-schemas.ts (the <type> schema + prompt), lib/map-ai-data.ts, lib/adapt-generated-game.ts
- Preview: components/dashboard/GamePreviewImage.tsx (the <TYPE> case), components/dashboard/GamePreviewModal.tsx
- Storage: app/api/games/route.ts and app/api/games/[id]/route.ts (how builderData is saved)

The intended concept is: <paste the concept from the table above>.

Please verify and fix the UI, logic, and both previews (the static card preview image
and the "Try the Game" modal) so they all match this concept. Make sure:
1. The builder produces the correct fields.
2. The engine renders the concept correctly (English target-language content, never
   the student's native language for answers/options).
3. The data mapping (folder-game-data.ts / map-ai-data.ts) doesn't drop or empty any field.
4. The previews are not empty/broken and show the right concept.
5. Report exactly which files you changed and why.
```

---

## Quick "what to provide" checklist

To get a good fix from another LLM, give it:
1. **The concept** (from the table above) — one sentence on how the game should play.
2. **The files** (builder + engine + `folder-game-data.ts` + `game-schemas.ts` + `map-ai-data.ts` + the two preview files + the games route).
3. **The fields** each item needs (from the table).
4. **A screenshot of the bug** (best signal of all).
5. The line: *"Never show the student's native language in answers/options; the target language must be English. Preview must not be empty."*
