// ── Unified Game Generation ──
// Single function that generates any game type via AI, validates with Zod,
// retries on failure, and returns a clear status.

import Groq from "groq-sdk";
import { getGameSchema } from "./game-schemas";
import type { GameSchemaConfig } from "./game-schemas";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export type GenerateResult = {
  status: "ready" | "needs_review";
  data: unknown;
  error?: string;
};

type Options = {
  targetLang?: string;
  nativeLang?: string;
  existingItems?: any[];
};

/**
 * Generate game content for a specific game type.
 *
 * @param gameType - The Prisma GameType enum value (e.g. "FLASHCARD", "CROSSWORD")
 * @param sourceContent - Text content to extract game material from (lesson text, topic description, etc.)
 * @param count - Number of items to generate (for crossword: number of words; for story: 1)
 * @param options - Optional: targetLang, nativeLang, existingItems
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

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const prompt = buildPrompt(schemaConfig, sourceContent, count, targetLang, nativeLang, attempt, lastError);

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
      if (!responseText) {
        lastError = "Groq returned empty content";
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        lastError = "Groq returned invalid JSON";
        continue;
      }

      // Validate against Zod schema
      const result = schemaConfig.schema.safeParse(parsed);
      if (result.success) {
        return { status: "ready", data: result.data };
      } else {
        lastError = result.error.message;
        // On first attempt, retry with the error fed back
        continue;
      }
    } catch (err: any) {
      lastError = err.message || "Unknown error during generation";
      continue;
    }
  }

  // Both attempts failed — return needs_review
  return {
    status: "needs_review",
    data: null,
    error: lastError || "Generation failed after 2 attempts",
  };
}

function buildPrompt(
  config: GameSchemaConfig,
  sourceContent: string,
  count: number,
  targetLang: string,
  nativeLang: string,
  attempt: number,
  previousError?: string
): string {
  const basePrompt = config.buildPrompt({ sourceContent, count, targetLang, nativeLang });

  if (attempt === 0) {
    return basePrompt;
  }

  // Second attempt: feed the validation error back so the AI can self-correct
  return `${basePrompt}

PREVIOUS ATTEMPT FAILED VALIDATION with this error:
${previousError || "Unknown validation error"}

Please fix the issue and ensure your response matches the exact JSON structure requested. Pay special attention to:
- All required fields are present
- Field names are spelled exactly as shown (including _target and _native suffixes)
- Strings are not empty
- Arrays have the correct minimum length`;
}
