import { NextResponse } from "next/server";
import { completeJSON } from "@/lib/ai-complete";
import { auth, getEducatorProfile } from "@/lib/auth";
import {
  checkAIGenerationLimit,
  incrementAIGenerationCount,
} from "@/lib/plan-guard";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getEducatorProfile(session.user.id);
    if (!profile) return NextResponse.json({ error: "Profile required" }, { status: 403 });

    // ── Check AI generation limit ──
    const limit = await checkAIGenerationLimit(profile.id);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Monthly AI generation limit reached. Upgrade to Pro for unlimited AI vocabulary generation.",
          remaining: 0,
          resetAt: limit.resetAt?.toISOString() ?? null,
        },
        { status: 429 }
      );
    }

    const { topic, language = "English", targetLanguage = "English", level = "B1", count = 10, contentType = "words" } = await req.json();

    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    // The word bank feeds many game types — some need single words, others need
    // phrases, full sentences, or grammar items. Ask the AI for the right kind so
    // downstream games (and the "fill game" step) get content that actually fits.
    const CONTENT_SPEC: Record<string, string> = {
      words: "single vocabulary words",
      phrases: "short phrases or common expressions (2-4 words each), not single words",
      sentences: "complete, natural example sentences",
      grammar: "grammar-focused items (e.g. verb forms, collocations, or target structures)",
    };
    const kind = CONTENT_SPEC[contentType as string] || CONTENT_SPEC.words;
    const unit = contentType === "sentences" ? "sentence" : contentType === "phrases" ? "phrase" : "word or item";

    // ── Bilingual contract ──
    // The #1 real-world bug: a teacher sets Translation Lang = Arabic (or French,
    // etc.) but the model returns an English *definition* instead of an actual
    // translation. Fast models paraphrase in the source language unless told very
    // firmly not to. So we branch: cross-language → demand a real translation in
    // the target language's own script; same-language → a concise synonym/gloss.
    const sameLang = language.trim().toLowerCase() === targetLanguage.trim().toLowerCase();
    const translationRule = sameLang
      ? `"translation" must be a SHORT synonym or one-line definition written in ${language} (source and translation language are the same here).`
      : `CRITICAL: "translation" MUST be the item written entirely in ${targetLanguage}, using ${targetLanguage}'s own alphabet/script and words.
- Do NOT answer in ${language}. Do NOT write an English definition, gloss, or explanation.
- It must be a genuine ${language}→${targetLanguage} translation a native ${targetLanguage} speaker would use.
- Example of the REQUIRED direction: for the ${language} word "book", the ${targetLanguage} translation is the single ${targetLanguage} word that means "book" (NOT the English phrase "a set of printed pages").`;

    const prompt = `Generate exactly ${count} ${kind} about the topic "${topic}" for ${level}-level learners.

Languages:
- Source language (the "word" field): ${language}
- Translation language (the "translation" field): ${targetLanguage}

Rules:
- "word": the ${unit} in ${language}.
- ${translationRule}
- "exampleSentence": a natural sentence in ${language} that uses the ${unit} in context.
- Every item must be filled in; never leave "translation" empty or equal to "word"${sameLang ? "" : ` and never write it in ${language}`}.

Respond ONLY with a valid JSON object in exactly this shape (no markdown, no commentary):
{
  "items": [
    { "word": "<${unit} in ${language}>", "translation": "<in ${targetLanguage}>", "exampleSentence": "<sentence in ${language}>" }
  ]
}`;

    const { text } = await completeJSON(
      [
        {
          role: "system",
          content: `You are a bilingual ${language}–${targetLanguage} language-learning assistant. You translate accurately INTO ${targetLanguage} and always return valid JSON only.`,
        },
        { role: "user", content: prompt },
      ],
      // Prefer a fast model first so word generation feels instant; discovery/
      // fallbacks still apply if it's unavailable. Lower temperature = more
      // faithful translations and less "creative" same-language drift.
      { temperature: 0.4, groqModels: ["llama-3.1-8b-instant"], geminiModels: ["gemini-flash-latest"] }
    );

    let jsonString = text.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const data = JSON.parse(jsonString);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid format returned from AI");
    }

    // ── Increment counter after successful generation ──
    await incrementAIGenerationCount(profile.id);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Gen Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate vocabulary" }, { status: 500 });
  }
}
