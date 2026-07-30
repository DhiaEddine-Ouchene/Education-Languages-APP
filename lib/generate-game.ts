// ── Unified Game Generation ──
// Single function that generates any game type via AI, validates with Zod,
// retries on failure, and returns a clear status.
// WORD_PAIR results are automatically persisted into VocabularySet.

import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { getGameSchema } from "./game-schemas";
import type { GameSchemaConfig } from "./game-schemas";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

// ── AI Field Normalization ──
// Normalizes field names from various AI output formats to the canonical simple format
// (word, translation, sentence, etc.) used by all game schemas and builders.
// Handles the old _target/_native format, plus common edge cases.
export function normalizeAiFields(parsed: unknown, gameType: string): unknown {
  if (!parsed || typeof parsed !== "object") return parsed;
  const data: Record<string, unknown> = { ...(parsed as Record<string, unknown>) };

  // Determine which array(s) to normalize based on game type
  const arrayKeys: string[] = ["items"];

  // Build reverse field mappings: old _target/_native → simple format
  const fieldMap: Record<string, string> = {
    word_target: "word",
    word_native: "translation",
    exampleSentence_target: "exampleSentence",
    exampleSentence_native: "exampleSentence",
    sentence_target: "sentence",
    sentence_native: "sentence",
    prompt_target: "question",
    prompt_native: "question",
    explanation_target: "explanation",
    ruleExplanation_target: "ruleExplanation",
    sentenceWithError_target: "sentenceWithError",
    categoryName_target: "category",
    baseWord_target: "baseWord",
    text_target: "text",
    scenario_target: "scenario",
    flawedSentence_target: "flawedSentence",
    guideline_target: "guideline",
  };

  // Normalize each target array
  for (const key of arrayKeys) {
    const arr = data[key];
    if (!Array.isArray(arr)) continue;

    data[key] = arr.map((item: unknown) => {
      if (!item || typeof item !== "object") return item;
      const norm = { ...(item as Record<string, unknown>) };

      // Map old _target/_native fields to simple names (if simple name is empty/missing)
      for (const [oldField, simpleField] of Object.entries(fieldMap)) {
        if (
          norm[oldField] !== undefined &&
          norm[oldField] !== null &&
          norm[oldField] !== "" &&
          (norm[simpleField] === undefined || norm[simpleField] === null || norm[simpleField] === "")
        ) {
          norm[simpleField] = norm[oldField];
        }
      }

      // Special case: QUIZ types with options as string array instead of object array
      if (["QUIZ", "MULTIPLE_CHOICE_GRAMMAR", "ERROR_SPOTTING", "WORD_IN_CONTEXT"].includes(gameType)) {
        if (Array.isArray(norm["options"]) && norm["options"].length > 0 && typeof norm["options"][0] === "string") {
          norm["options"] = norm["options"]; // Already a string array — keep as-is
        }
        // Map old format: options[{option_target}] → options[strings]
        if (Array.isArray(norm["options"]) && norm["options"].length > 0 && typeof norm["options"][0] === "object") {
          norm["options"] = (norm["options"] as any[]).map((o: any) => o.option_target || o.option || "");
        }
      }

      return norm;
    });
  }

  // Handle crossword specially (uses "words" array, not "items")
  if (gameType === "CROSSWORD") {
    const words = data["words"];
    if (Array.isArray(words)) {
      data["words"] = words.map((item: unknown) => {
        if (!item || typeof item !== "object") return item;
        const norm = { ...(item as Record<string, unknown>) };
        if (norm["word_target"] && !norm["word"]) norm["word"] = norm["word_target"];
        if (norm["clue_target"] && !norm["clue"]) norm["clue"] = norm["clue_target"];
        if (norm["word_native"] && !norm["translation"]) norm["translation"] = norm["word_native"];
        return norm;
      });
    }
  }

  // Handle verb conjugation specially
  if (gameType === "VERB_CONJUGATION") {
    const forms = data["forms"];
    if (Array.isArray(forms)) {
      data["forms"] = forms.map((item: unknown) => {
        if (!item || typeof item !== "object") return item;
        const norm = { ...(item as Record<string, unknown>) };
        if (norm["form_target"] && !norm["form"]) norm["form"] = norm["form_target"];
        return norm;
      });
    }
  }

  return data;
}

export type GenerateResult = {
  status: "ready" | "needs_review";
  data: unknown;
  error?: string;
  /** If WORD_PAIR was persisted, the VocabularySet id */
  wordSetId?: string;
};

type Options = {
  targetLang?: string;
  nativeLang?: string;
  /** If provided, upserts into this existing VocabularySet instead of creating a new one */
  wordSetId?: string;
  educatorId?: string;
  instructions?: string;
  /** If true, persist generated word pairs into a VocabularySet. Default false. */
  persistVocab?: boolean;
};

// Schema types that produce word-pair content (map to VocabularySet)
const WORD_PAIR_TYPES = [
  "FLASHCARD","FLASHCARD_3D","MEMORY","WORD_MEANING_MATCH",
  "WORD_SCRAMBLE","PICTURE_TO_WORD","SPEED_ROUND",
];

/**
 * Generate game content for a specific game type.
 * For WORD_PAIR types, automatically persists into VocabularySet.
 */
export async function generateGame(
  gameType: string,
  sourceContent: string,
  count: number,
  options?: Options
): Promise<GenerateResult> {
  const schemaConfig = getGameSchema(gameType);
  if (!schemaConfig) {
    return { status: "needs_review", data: null, error: `No schema found for game type: ${gameType}` };
  }

  const targetLang = options?.targetLang || "English";
  const nativeLang = options?.nativeLang || "English";
  const isWordPair = WORD_PAIR_TYPES.includes(gameType);

  // Try generation, retry once on validation failure
  let lastError: string | undefined;
  let parsedData: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const prompt = buildPrompt(schemaConfig, sourceContent, count, targetLang, nativeLang, attempt, lastError, options?.instructions);

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: `You are a language curriculum designer. Generate content for a "${schemaConfig.description}" exercise in ${targetLang}. Native language: ${nativeLang}. Always respond with valid JSON only.` },
          { role: "user", content: prompt },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) { lastError = "Groq returned empty content"; continue; }

      let parsed: unknown;
      try { parsed = JSON.parse(responseText); } catch { lastError = "Groq returned invalid JSON"; continue; }

      // DEBUG: log what the AI returned
      console.log("[generate-game] AI response for", gameType, ":", JSON.stringify(parsed).substring(0, 500));
      console.log("[generate-game] Prompt sent:", prompt.substring(0, 500));

      // Normalize field names before Zod validation (handles old _target/_native format)
      const normalized = normalizeAiFields(parsed, gameType);

      console.log("[generate-game] Normalized for", gameType, ":", JSON.stringify(normalized).substring(0, 500));

      const result = schemaConfig.schema.safeParse(normalized);
      if (result.success) { parsedData = result.data; break; }
      else {
        console.log("[generate-game] Schema validation FAILED:", result.error.message.substring(0, 300));
        lastError = result.error.message;
        continue;
      }
    } catch (err: any) {
      lastError = err.message || "Unknown error during generation";
      continue;
    }
  }

  if (!parsedData) {
    return { status: "needs_review", data: null, error: lastError || "Generation failed after 2 attempts" };
  }

  // ── Persist WORD_PAIR results into VocabularySet ──
  let wordSetId = options?.wordSetId;
  if (isWordPair && options?.educatorId && options?.persistVocab) {
    try {
      const items = (parsedData as any).items || [];
      if (items.length > 0) {
        if (wordSetId) {
          // Update existing set: delete old items, create new ones
          await prisma.vocabularyItem.deleteMany({ where: { setId: wordSetId } });
          await prisma.vocabularyItem.createMany({
            data: items.map((item: any, i: number) => ({
              setId: wordSetId!,
              word: item.word_target || "",
              translation: item.word_native || "",
              exampleSentence: item.exampleSentence_target || null,
              synonyms: item.synonyms || [],
              antonyms: item.antonyms || [],
            })),
          });
        } else {
          // Create new VocabularySet
          const set = await prisma.vocabularySet.create({
            data: {
              educatorId: options.educatorId,
              name: `Generated: ${gameType} (${new Date().toLocaleDateString()})`,
              language: targetLang,
              items: {
                create: items.map((item: any, i: number) => ({
                  word: item.word_target || "",
                  translation: item.word_native || "",
                  exampleSentence: item.exampleSentence_target || null,
                  synonyms: item.synonyms || [],
                  antonyms: item.antonyms || [],
                })),
              },
            },
          });
          wordSetId = set.id;
        }
      }
    } catch (err: any) {
      console.error("[generate-game] Failed to persist VocabularySet:", err);
      // Non-fatal: still return the data, just without persistence
    }
  }

  return { status: "ready", data: parsedData, wordSetId };
}

function buildPrompt(
  config: GameSchemaConfig,
  sourceContent: string,
  count: number,
  targetLang: string,
  nativeLang: string,
  attempt: number,
  previousError?: string,
  instructions?: string
): string {
  let basePrompt = config.buildPrompt({ sourceContent, count, targetLang, nativeLang });

  if (instructions) {
    basePrompt += `\n\nADDITIONAL INSTRUCTIONS:\n${instructions}`;
  }

  if (attempt === 0) return basePrompt;

  return `${basePrompt}

PREVIOUS ATTEMPT FAILED VALIDATION with this error:
${previousError || "Unknown validation error"}

Please fix the issue and ensure your response matches the exact JSON structure requested. Pay special attention to:
- All required fields are present
- Field names are spelled exactly as shown (including _target and _native suffixes)
- Strings are not empty
- Arrays have the correct minimum length`;
}

// ── Word Bank → Game Generation ──
// Fetches a saved word bank by ID, formats its items, and generates game content.

export type WordBankGenerateOptions = Options & {
  /** Extra scenario/setting for SITUATION_DIALOGUE_FILL */
  scenarioDescription?: string;
  /** Specific verb for VERB_CONJUGATION */
  verb?: string;
  /** Specific tense for VERB_CONJUGATION */
  tense?: string;
  /** In-memory word bank items if no saved wordBankId exists */
  words?: { word: string; translation?: string; exampleSentence?: string }[];
};

export async function generateGameFromWordBank(
  gameType: string,
  wordBankId?: string | null,
  count: number = 10,
  options?: WordBankGenerateOptions
): Promise<GenerateResult> {
  let sourceContent = "";
  let targetLang = options?.targetLang || "English";
  let nativeLang = options?.nativeLang || "English";
  let wordCount = 0;  // Track available words for count clamping

  // 1. Fetch word bank items from DB or use passed words array
  if (wordBankId) {
    let wordBank;
    try {
      wordBank = await prisma.vocabularySet.findUnique({
        where: { id: wordBankId },
        include: { items: true },
      });
    } catch (err: any) {
      return { status: "needs_review", data: null, error: `Failed to fetch word bank: ${err.message}` };
    }

    if (!wordBank) {
      return { status: "needs_review", data: null, error: `Word bank not found: ${wordBankId}` };
    }

    if (wordBank.items.length === 0) {
      return { status: "needs_review", data: null, error: "Word bank has no items" };
    }
    wordCount = wordBank.items.length;

    targetLang = options?.targetLang || wordBank.language || "English";
    nativeLang = options?.nativeLang || (wordBank as any).nativeLanguage || "English";

    sourceContent = wordBank.items
      .map((item, i) => {
        const parts = [`${i + 1}. ${item.word}`];
        if (item.translation) parts.push(`— ${item.translation}`);
        if (item.exampleSentence) parts.push(`(${item.exampleSentence})`);
        return parts.join(" ");
      })
      .join("\n");
  } else if (options?.words && options.words.length > 0) {
    sourceContent = options.words
      .map((item, i) => {
        const parts = [`${i + 1}. ${item.word}`];
        if (item.translation) parts.push(`— ${item.translation}`);
        if (item.exampleSentence) parts.push(`(${item.exampleSentence})`);
        return parts.join(" ");
      })
      .join("\n");
    wordCount = options.words.length;
  } else {
    return { status: "needs_review", data: null, error: "Please add words to the word bank first" };
  }

  // 4. Handle special-case game types
  if (gameType === "SITUATION_DIALOGUE_FILL" && options?.scenarioDescription) {
    sourceContent = `SCENARIO: ${options.scenarioDescription}\n\nVOCABULARY TO USE:\n${sourceContent}`;
  }

  if (gameType === "VERB_CONJUGATION") {
    const verb = options?.verb || (options?.words?.[0]?.word) || "to be";
    const tense = options?.tense || "Present";
    sourceContent = `Verb: ${verb}\nTense: ${tense}`;
  }

  if (gameType === "MINIMAL_PAIR") {
    const items = options?.words || [];
    sourceContent = items.map((item) => item.word).join(", ");
  }

  // For gap-fill types: send just the vocabulary words (no definitions)
  const GAP_FILL_TYPES = ["FILL_GAP_WORD", "LISTEN_FILL_WORD", "SPEAK_FILL_WORD", "FILL_BLANK_GRAMMAR", "DICTATION", "SENTENCE_BUILDER", "LISTEN_FILL_SENTENCE", "SPEAK_FILL_SENTENCE"];
  if (GAP_FILL_TYPES.includes(gameType)) {
    const items = options?.words || [];
    if (items.length > 0) {
      sourceContent = items.map((item) => item.word).join(", ");
    }
  }

  // Clamp count to available word bank size for gap-fill types
  // Without this, AI is asked to generate 10+ items from 3-5 words, leading to
  // invented vocabulary and sentences that don't use the word bank words.
  const VOCAB_ANSWER_TYPES = ["FILL_GAP_WORD", "LISTEN_FILL_WORD", "SPEAK_FILL_WORD", "FILL_BLANK_GRAMMAR"];
  if (VOCAB_ANSWER_TYPES.includes(gameType) && wordCount > 0 && count > wordCount) {
    console.log(`[generate-game] Clamped count ${count} → ${wordCount} (word bank size) for ${gameType}`);
    count = wordCount;
  }

  // 5. Delegate to the existing generateGame function
  return generateGame(gameType, sourceContent, count, {
    ...options,
    targetLang,
    nativeLang,
    wordSetId: wordBankId || undefined,
    educatorId: options?.educatorId,
  });
}

