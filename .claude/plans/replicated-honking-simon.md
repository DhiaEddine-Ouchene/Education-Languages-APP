# Per-Game-Type AI Generation Schemas

## Context

The AI game generation system (`lib/game-schemas.ts`) currently groups 27 game types into 4 generic schemas (WORD_PAIR, SENTENCE_FILL, QUIZ_QUESTION, AUDIO_RESPONSE) + 5 dedicated ones. These generic schemas don't match the actual data structures each game type needs.

**Examples of mismatches:**
- **Odd One Out** uses WORD_PAIR but needs `{groupWords[], oddWord, categoryName}`
- **Collocation Builder** uses WORD_PAIR but needs `{baseWord, correctPartners[], wrongPartners[]}`
- **Word in Context** uses SENTENCE_FILL but needs `{word, correctSentence, incorrectSentences[]}`
- **Error Spotting** uses QUIZ_QUESTION but needs `{sentenceWithError, wrongPart, correction, ruleExplanation}`
- **Rewrite/Improve** (FILL_BLANK writing variant) has no proper schema

This causes the AI to generate incorrectly structured data that doesn't match what game components and builders expect.

## Plan

### Phase 1: Replace generic Zod schemas with per-game-type schemas in `lib/game-schemas.ts`

Remove the 4 generic schemas (WORD_PAIR, SENTENCE_FILL, QUIZ_QUESTION, AUDIO_RESPONSE) and replace with targeted schemas:

**Schema Group A — Word + Translation (shared data shape)**
| Schema Name | Fields | Game Types |
|-------------|--------|------------|
| `FLASHCARD_SCHEMA` | `word_target, word_native, exampleSentence_target?` | FLASHCARD, MEMORY, WORD_MEANING_MATCH, FLASHCARD_3D |

**Schema Group B — Word + Clue/Hint (shared data shape)**
| Schema Name | Fields | Game Types |
|-------------|--------|------------|
| `WORD_CLUE_SCHEMA` | `word_target, word_native?, hint_target?` | WORD_SCRAMBLE, SPEED_ROUND |

**Schema Group C — Sentence Fill (shared data shape)**
| Schema Name | Fields | Game Types |
|-------------|--------|------------|
| `SENTENCE_FILL_SCHEMA` | `sentence_target, correctAnswer, options[]` | FILL_GAP_WORD, LISTEN_FILL_WORD, SPEAK_FILL_WORD |

**Schema Group D — Audio Only (shared data shape)**
| Schema Name | Fields | Game Types |
|-------------|--------|------------|
| `AUDIO_TRANSCRIPTION_SCHEMA` | `audioPrompt` | DICTATION, LISTEN_FILL_SENTENCE, SPEAK_FILL_SENTENCE |

**Schema Group E — Multiple Choice (shared data shape)**
| Schema Name | Fields | Game Types |
|-------------|--------|------------|
| `MULTI_CHOICE_SCHEMA` | `prompt_target, options[option_target], correctAnswer, explanation_target?` | QUIZ, MULTIPLE_CHOICE_GRAMMAR |

**Schema Group F — Unique (one schema per game type)**
| Schema Name | Fields | Game Types |
|-------------|--------|------------|
| `SYNONYM_ANTONYM_SCHEMA` (update) | `word, synonym, antonym, distractors[]` | SYNONYM_ANTONYM |
| `WORD_IN_CONTEXT_SCHEMA` | `word, correctSentence, incorrectSentences[]` | WORD_IN_CONTEXT |
| `SITUATION_DIALOGUE_SCHEMA` | `scenario, lines[{speaker, text, blanks:[{position, correctAnswer, options[]}]}]` | SITUATION_DIALOGUE_FILL |
| `ODD_ONE_OUT_SCHEMA` | `groupWords[5], oddWord, categoryName` | ODD_ONE_OUT |
| `COLLOCATION_SCHEMA` | `baseWord, correctPartners[], wrongPartners[]` | COLLOCATION_BUILDER |
| `PICTURE_TO_WORD_SCHEMA` | `word, imageSearchTerm, distractors[]` | PICTURE_TO_WORD |
| `ERROR_SPOTTING_SCHEMA` | `sentenceWithError, wrongPart, correction, ruleExplanation` | ERROR_SPOTTING |
| `DRAG_DROP_SCHEMA` | `items[], categories[], placements[{itemIndex, category}]` | DRAG_DROP |
| `GRAMMAR_FILL_SCHEMA` | `sentence_target, baseVerb, correctConjugation` | FILL_BLANK_GRAMMAR |
| `SENTENCE_BUILDER_SCHEMA` | `sentence_target` | SENTENCE_BUILDER |
| `REWRITE_SCHEMA` | `flawedSentence, guideline?` | FILL_BLANK (writing/"Fill & Rewrite") |

**Keep existing dedicated schemas unchanged:**
- `CROSSWORD_SCHEMA` — keep current fields
- `VERB_CONJUGATION_SCHEMA` — keep current fields  
- `STORY_SCHEMA` — keep current fields
- `MINIMAL_PAIR_SCHEMA` — keep current fields

### Phase 2: Create dedicated prompt builders

For each new/updated schema, write a `buildPrompt` function that tells the AI exactly what fields to generate in the target language. Each prompt is ~15-25 lines of template literal text.

Current prompt builders to **replace**:
- `wordPairPrompt` → split into: `flashcardPrompt`, `wordCluePrompt`
- `sentenceFillPrompt` → split into: `sentenceFillPrompt` (simplified), `grammarFillPrompt`, `sentenceBuilderPrompt`
- `quizQuestionPrompt` → simplified to `multiChoicePrompt`
- `audioResponsePrompt` → replaced with `audioTranscriptionPrompt`

New prompt builders to **create**:
- `oddOneOutPrompt`, `collocationPrompt`, `pictureToWordPrompt`, `errorSpottingPrompt`
- `wordInContextPrompt`, `situationDialoguePrompt`, `dragDropPrompt`, `rewritePrompt`

Existing prompt builders to **keep**:
- `synonymAntonymPrompt`, `minimalPairPrompt`, `crosswordPrompt`, `verbConjugationPrompt`, `storyPrompt`

### Phase 3: Update GAME_SCHEMAS registry

Rebuild the `GAME_SCHEMAS` record so each of the 27 game types points to its correct schema + prompt builder. Structure stays the same (`GameSchemaConfig` type unchanged).

### Phase 4: Update WORD_PAIR_TYPES list

In `lib/generate-game.ts`, update `WORD_PAIR_TYPES` to only include types whose AI output can map to VocabularySet items (word + translation):
- **Keep**: FLASHCARD, MEMORY, WORD_MEANING_MATCH, FLASHCARD_3D, WORD_SCRAMBLE, SYNONYM_ANTONYM, SPEED_ROUND, PICTURE_TO_WORD
- **Remove**: COLLOCATION_BUILDER, ODD_ONE_OUT, MINIMAL_PAIR

### Files to modify:
- `lib/game-schemas.ts` — primary changes (~150 lines added/removed)
- `lib/generate-game.ts` — update WORD_PAIR_TYPES (1 line change)

### Files NOT to modify:
- Game components (they receive processed data from builders)
- Builder components (they already handle specific data shapes)
- API routes (they just call `generateGame()` generically)
- Game type metadata

### Verification:
1. `npx tsc --noEmit` — TypeScript compiles clean
2. Start dev server, navigate to game creation page
3. Test AI generation for each game type to verify output structure matches
4. Verify builders render generated data correctly
5. Check game preview to confirm games render
