import { NextResponse } from "next/server";
import { z } from "zod";
import { requireEducator } from "@/lib/api";
import { generateGameFromWordBank } from "@/lib/generate-game";
import {
  checkAIGenerationLimit,
  incrementAIGenerationCount,
} from "@/lib/plan-guard";

const schema = z.object({
  gameType: z.string().min(1),
  wordBankId: z.string().optional().nullable(),
  words: z.array(z.object({
    word: z.string(),
    translation: z.string().optional(),
    exampleSentence: z.string().optional(),
  })).optional(),
  count: z.number().int().min(1).max(50).default(10),
  options: z.object({
    scenarioDescription: z.string().optional(),
    verb: z.string().optional(),
    tense: z.string().optional(),
    targetLang: z.string().optional(),
    nativeLang: z.string().optional(),
  }).optional(),
});

export async function POST(req: Request) {
  try {
    const { error, profile } = await requireEducator();
    if (error) return error;

    // ── Check AI generation limit ──
    const limit = await checkAIGenerationLimit(profile!.id);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Monthly AI generation limit reached. Upgrade to Pro for unlimited AI games.",
          remaining: 0,
          resetAt: limit.resetAt?.toISOString() ?? null,
        },
        { status: 429 }
      );
    }

    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }

    const { gameType, wordBankId, words, count, options } = body.data;

    const result = await generateGameFromWordBank(gameType, wordBankId, count, {
      ...options,
      words,
      educatorId: profile!.id,
    });

    if (result.status === "needs_review") {
      return NextResponse.json(
        { success: false, status: "needs_review", error: result.error, data: result.data },
        { status: 422 }
      );
    }

    // ── Increment counter after successful generation ──
    await incrementAIGenerationCount(profile!.id);

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    console.error("[generate-game] POST Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate game" }, { status: 500 });
  }
}
