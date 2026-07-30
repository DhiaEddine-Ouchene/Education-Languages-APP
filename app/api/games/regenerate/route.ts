import { NextResponse } from "next/server";
import { requireEducator } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generateGame } from "@/lib/generate-game";

// Types that map to dedicated Prisma tables (not WordPairs / settings JSON)
const QUIZ_TYPES = ["QUIZ","MULTIPLE_CHOICE_GRAMMAR","ERROR_SPOTTING","WORD_IN_CONTEXT"];
const SENTENCE_FILL_TYPES = ["FILL_BLANK","FILL_GAP_WORD","FILL_BLANK_GRAMMAR","DRAG_DROP","SITUATION_DIALOGUE_FILL","SENTENCE_BUILDER","LISTEN_FILL_WORD","LISTEN_FILL_SENTENCE","SPEAK_FILL_WORD","SPEAK_FILL_SENTENCE","DICTATION"];

export async function POST(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const { gameId, sourceContent, count, targetLang, nativeLang, instructions } = await req.json();
    if (!gameId || !sourceContent) {
      return NextResponse.json({ error: "gameId and sourceContent are required" }, { status: 400 });
    }

    // Fetch the game and verify ownership
    const game = await prisma.game.findFirst({ where: { id: gameId, educatorId: profile!.id } });
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const type = game.type;
    const currentVersion = (game as any).version || 1;

    // Generate new content
    const result = await generateGame(type, sourceContent, count || 8, {
      targetLang: targetLang || "English",
      nativeLang: nativeLang || "English",
      educatorId: profile!.id,
      wordSetId: game.vocabularySetId || undefined,
      instructions,
    });

    if (result.status === "ready") {
      // Store current data as previous before overwriting
      const currentData: Record<string, unknown> = {};
      if (game.vocabularySetId) currentData.vocabularySetId = game.vocabularySetId;
      if (game.settings) currentData.settings = game.settings;

      const updateData: Record<string, unknown> = {
        generationStatus: "ready",
        generationError: null,
        generationRaw: undefined,
        version: currentVersion + 1,
        previousData: currentData,
      };

      // ── WORD_PAIR: link/re-link vocabulary set ──
      if (result.wordSetId) {
        updateData.vocabularySetId = result.wordSetId;
      }

      // ── QUIZ types: persist into QuizData ──
      if (QUIZ_TYPES.includes(type)) {
        const questions = ((result.data as any)?.items || []).map((q: any, i: number) => ({
          prompt: q.prompt_target || q.prompt || "",
          options: q.options || [],
          correctAnswer: q.correctAnswer || "",
          explanation: q.explanation_target || q.explanation || null,
          order: i,
        }));
        if (questions.length > 0) {
          // Delete existing, recreate
          const existing = await prisma.quizData.findUnique({ where: { gameId } });
          if (existing) await prisma.question.deleteMany({ where: { quizDataId: existing.id } });
          await prisma.quizData.upsert({
            where: { gameId },
            create: { gameId, config: { optionsCount: 4 }, questions: { create: questions } },
            update: { config: { optionsCount: 4 }, questions: { deleteMany: {}, create: questions } },
          });
        }
      }

      // ── CROSSWORD ──
      if (type === "CROSSWORD") {
        const d = result.data as any;
        await prisma.crosswordData.upsert({
          where: { gameId },
          create: { gameId, gridSize: d.gridSize || 8, words: d.words || [] },
          update: { gridSize: d.gridSize || 8, words: d.words || [] },
        });
      }

      // ── VERB CONJUGATION ──
      if (type === "VERB_CONJUGATION") {
        const d = result.data as any;
        await prisma.verbConjugationData.upsert({
          where: { gameId },
          create: { gameId, verb: d.verb || "", tense: d.tense || "Present", forms: d.forms || {} },
          update: { verb: d.verb || "", tense: d.tense || "Present", forms: d.forms || {} },
        });
      }

      // ── STORY ──
      if (type === "STORY") {
        const d = result.data as any;
        await prisma.storyData.upsert({
          where: { gameId },
          create: { gameId, prompt: d.prompt_target || "", wordBank: d.wordBank || null, template: d.template_target || null },
          update: { prompt: d.prompt_target || "", wordBank: d.wordBank || null, template: d.template_target || null },
        });
      }

      // ── SENTENCE_FILL / other: store into settings JSON ──
      if (SENTENCE_FILL_TYPES.includes(type)) {
        const items = ((result.data as any)?.items || []).map((i: any, idx: number) => ({
          sentence: i.sentence_target || i.sentence || "",
          correctAnswer: i.correctAnswer || "",
          options: i.options || [],
          order: idx,
        }));
        const existingSettings = (game.settings as Record<string, unknown>) || {};
        (updateData as any).settings = { ...existingSettings, sentenceItems: items };
      }

      // ── AUDIO_RESPONSE: store into settings JSON ──
      if (["DICTATION","LISTEN_FILL_WORD","LISTEN_FILL_SENTENCE","SPEAK_FILL_WORD","SPEAK_FILL_SENTENCE"].includes(type)) {
        const items = ((result.data as any)?.items || []).map((i: any, idx: number) => ({
          audioPrompt: i.audioPrompt || "",
          expectedResponse: i.expectedResponse_target || "",
          hints: i.hints || [],
          order: idx,
        }));
        const existingSettings = (game.settings as Record<string, unknown>) || {};
        (updateData as any).settings = { ...existingSettings, audioItems: items };
      }

      // Save the generated data in settings too for preview
      const existingSettings = (game.settings as Record<string, unknown>) || {};
      if (!(updateData as any).settings) {
        (updateData as any).settings = { ...existingSettings, generated: result.data };
      }

      await prisma.game.update({ where: { id: gameId }, data: updateData as any });

      return NextResponse.json({ success: true, data: result.data, wordSetId: result.wordSetId });
    } else {
      // Save the raw output for review
      await prisma.game.update({
        where: { id: gameId },
        data: {
          generationStatus: "needs_review",
          generationError: result.error,
          generationRaw: (result.data as object) || undefined,
        },
      });
      return NextResponse.json({ success: false, status: "needs_review", error: result.error });
    }
  } catch (err: any) {
    console.error("[games/regenerate]", err);
    return NextResponse.json({ error: err.message || "Regeneration failed" }, { status: 500 });
  }
}
