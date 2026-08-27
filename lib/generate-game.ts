// ── Unified Game Generation ──
// Single function that generates any game type via AI, validates with Zod,
// retries on failure, and returns a clear status.
// Games own their content directly (no reusable vocabulary set).

import { completeJSON } from "./ai-complete";
import { getGameSchema } from "./game-schemas";
import type { GameSchemaConfig } from "./game-schemas";

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
      if (["QUIZ", "MULTIPLE_CHOICE_GRAMMAR", "ERROR_SPOTTING"].includes(gameType)) {
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
};

type Options = {
  targetLang?: string;
  nativeLang?: string;
  educatorId?: string;
  instructions?: string;
};

/**
 * Generate game content for a specific game type.
 * Games own their content directly (no reusable vocabulary set).
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

  // Try generation, retry once on validation failure
  let lastError: string | undefined;
  let parsedData: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const prompt = buildPrompt(schemaConfig, sourceContent, count, targetLang, nativeLang, attempt, lastError, options?.instructions);

      // Bilingual contract: a teacher may teach in `targetLang` but want students
      // to understand via `nativeLang`. Any translation/meaning field must be
      // written in the correct language — never a same-language paraphrase when
      // the two languages differ (fast models drift toward this otherwise).
      const sameLang = targetLang.trim().toLowerCase() === nativeLang.trim().toLowerCase();
      const langRule = sameLang
        ? `Both the content language and the learner's language are ${targetLang}.`
        : `Content/target language is ${targetLang}. Learner's native language is ${nativeLang}. Any "_native"/translation/meaning field MUST be written in ${nativeLang} (its own script), never in ${targetLang}.`;

      const { text: responseText } = await completeJSON(
        [
          { role: "system", content: `You are a language curriculum designer. Generate content for a "${schemaConfig.description}" exercise. ${langRule} Always respond with valid JSON only.` },
          { role: "user", content: prompt },
        ],
        // Prefer a fast model first so generation feels responsive; discovery and
        // fallbacks still kick in if it's unavailable.
        { temperature: 0.3, groqModels: ["llama-3.1-8b-instant"], geminiModels: ["gemini-flash-latest"] }
      );

      if (!responseText) { lastError = "AI returned empty content"; continue; }

      let parsed: unknown;
      try { parsed = JSON.parse(responseText); } catch { lastError = "AI returned invalid JSON"; continue; }

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

  return { status: "ready", data: parsedData };
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
  /** A topic to generate items about directly (no intermediate word list needed). */
  topic?: string;
};

export async function generateGameFromWordBank(
  gameType: string,
  _wordBankId?: string | null,
  count: number = 10,
  options?: WordBankGenerateOptions
): Promise<GenerateResult> {
  let sourceContent = "";
  let targetLang = options?.targetLang || "English";
  let nativeLang = options?.nativeLang || "English";
  let wordCount = 0;  // Track available words for count clamping

  // Games own their word bank in-memory (no reusable saved set).
  if (options?.words && options.words.length > 0) {
    sourceContent = options.words
      .map((item, i) => {
        const parts = [`${i + 1}. ${item.word}`];
        if (item.translation) parts.push(`— ${item.translation}`);
        if (item.exampleSentence) parts.push(`(${item.exampleSentence})`);
        return parts.join(" ");
      })
      .join("\n");
    wordCount = options.words.length;
  } else if (options?.topic) {
    // Generate items directly about a topic — no intermediate word list.
    sourceContent = `Topic: ${options.topic}`;
    wordCount = count;
  } else {
    return { status: "needs_review", data: null, error: "Provide a topic or words to generate from" };
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

  if (gameType === "MINIMAL_PAIR" && options?.words?.length) {
    const items = options?.words || [];
    sourceContent = items.map((item) => item.word).join(", ");
  }

  // For gap-fill types: send just the vocabulary words (no definitions)
  const GAP_FILL_TYPES = ["FILL_GAP_WORD", "LISTEN_FILL_WORD", "SPEAK_FILL_WORD", "DICTATION", "SENTENCE_BUILDER", "LISTEN_FILL_SENTENCE", "SPEAK_FILL_SENTENCE"];
  if (GAP_FILL_TYPES.includes(gameType)) {
    const items = options?.words || [];
    if (items.length > 0) {
      sourceContent = items.map((item) => item.word).join(", ");
    }
  }

  // Clamp count to available word bank size for gap-fill types
  // Without this, AI is asked to generate 10+ items from 3-5 words, leading to
  // invented vocabulary and sentences that don't use the word bank words.
  const VOCAB_ANSWER_TYPES = ["FILL_GAP_WORD", "LISTEN_FILL_WORD", "SPEAK_FILL_WORD"];
  if (VOCAB_ANSWER_TYPES.includes(gameType) && wordCount > 0 && count > wordCount) {
    console.log(`[generate-game] Clamped count ${count} → ${wordCount} (word bank size) for ${gameType}`);
    count = wordCount;
  }

  // 5. Delegate to the existing generateGame function
  return generateGame(gameType, sourceContent, count, {
    ...options,
    targetLang,
    nativeLang,
  });
}

