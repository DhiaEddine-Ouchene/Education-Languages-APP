import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";
import { checkGamePublishLimit, checkGameTypeAllowed } from "@/lib/plan-guard";

const schema = z.object({
  title: z.string().min(2),
  type: z.enum([
    "FLASHCARD", "FILL_BLANK", "DRAG_DROP", "QUIZ", "DICTATION", "MEMORY", "SPEED_ROUND", "STORY",
    "SYNONYM_ANTONYM", "FILL_GAP_WORD", "SITUATION_DIALOGUE_FILL",
    "WORD_SCRAMBLE", "CATEGORY_SORT",
    "WORD_MEANING_MATCH", "WORD_IN_CONTEXT", "ODD_ONE_OUT", "COLLOCATION_BUILDER",
    "SENTENCE_BUILDER", "ERROR_SPOTTING", "VERB_CONJUGATION", "MULTIPLE_CHOICE_GRAMMAR",
    "TRANSFORMATION",
    "LISTEN_FILL_WORD", "LISTEN_FILL_SENTENCE", "SPEAK_FILL_WORD", "SPEAK_FILL_SENTENCE",
    "WRITING_RUBRIC", "SPEAKING",
    "CROSSWORD", "FLASHCARD_3D", "MINIMAL_PAIR", "PICTURE_TO_WORD",
  ]),
  settings: z.record(z.unknown()).default({}),
  isPublished: z.boolean().default(false),
  courseId: z.string().optional(),
  builderData: z.record(z.unknown()).optional(),
});

export async function GET(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const games = await prisma.game.findMany({
      where: {
        educatorId: profile!.id,
        ...(courseId ? { courseId } : {}),
      },
      include: {
        _count: { select: { progress: true, assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(games);
  } catch (err: any) {
    console.error("[games:GET]", err);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }

    const { title, type, settings, isPublished, courseId, builderData } = body.data;

    // ── 1. Plan guard: Check Game Type ──
    const typeCheck = await checkGameTypeAllowed(profile!.id, type);
    if (!typeCheck.allowed) {
      return NextResponse.json(
        { error: typeCheck.reason, requiresUpgrade: true, requiredTier: "PRO" },
        { status: 403 }
      );
    }

    // ── 2. Plan guard: Check Game Publish Limit (if isPublished) ──
    if (isPublished) {
      const publishCheck = await checkGamePublishLimit(profile!.id);
      if (!publishCheck.allowed) {
        return NextResponse.json(
          {
            error: `Published game limit reached (${publishCheck.limit} games max on Free). Upgrade to Pro for unlimited published games.`,
            requiresUpgrade: true,
            requiredTier: "PRO",
            publishedCount: publishCheck.publishedCount,
            limit: publishCheck.limit,
          },
          { status: 403 }
        );
      }
    }

    // Create the game
    const game = await prisma.game.create({
      data: {
        educatorId: profile!.id,
        title: title.trim(),
        type: type as any,
        settings: settings as object,
        isPublished: isPublished,
        courseId: courseId || undefined,
      },
    });

    // Handle type-specific relational data if supplied
    const bd = builderData;
    if (bd && typeof bd === "object") {
      if (["FLASHCARD","WORD_SCRAMBLE","PICTURE_TO_WORD","FLASHCARD_3D","MEMORY","MINIMAL_PAIR","SPEED_ROUND"].includes(type)) {
        const pairs = (bd.pairs as any[]) || [];
        if (pairs.length > 0) {
          await prisma.flashcardData.create({
            data: {
              gameId: game.id,
              pairs: {
                create: pairs.map((p: any, i: number) => ({
                  word: p.word || "",
                  translation: p.translation || "",
                  exampleSentence: p.exampleSentence || null,
                  audioUrl: p.audioUrl || null,
                  imageUrl: p.imageUrl || null,
                  order: p.order ?? i,
                })),
              },
            },
          });
        }
      }

      if (["QUIZ","MULTIPLE_CHOICE_GRAMMAR","ERROR_SPOTTING"].includes(type)) {
        const questions = (bd.questions as any[]) || [];
        if (questions.length > 0) {
          await prisma.quizData.create({
            data: {
              gameId: game.id,
              config: { optionsCount: bd.optionsCount || 4 },
              questions: {
                create: questions.map((q: any, i: number) => ({
                  prompt: q.prompt || "",
                  options: q.options || [],
                  correctAnswer: q.correctAnswer || "",
                  explanation: q.explanation || null,
                  order: q.order ?? i,
                })),
              },
            },
          });
        }
      }

      if (type === "CROSSWORD") {
        await prisma.crosswordData.create({
          data: {
            gameId: game.id,
            gridSize: (bd.gridSize as number) || 8,
            words: JSON.parse(JSON.stringify(bd.words || [])),
          },
        });
      }

      if (type === "VERB_CONJUGATION") {
        await prisma.verbConjugationData.create({
          data: {
            gameId: game.id,
            verb: (bd.verb as string) || "",
            tense: (bd.tense as string) || "Present",
            forms: JSON.parse(JSON.stringify(bd.forms || {})),
          },
        });
      }

      if (type === "STORY") {
        await prisma.storyData.create({
          data: {
            gameId: game.id,
            prompt: (bd.prompt as string) || "",
            wordBank: bd.wordBank ? JSON.parse(JSON.stringify(bd.wordBank)) : null,
            template: (bd.template as string) || null,
          },
        });
      }
    }

    const createdGame = await prisma.game.findUnique({
      where: { id: game.id },
      include: {
        flashcardData: { include: { pairs: true } },
        quizData: { include: { questions: true } },
        crosswordData: true,
        verbConjugationData: true,
        storyData: true,
      },
    });

    return NextResponse.json(createdGame, { status: 201 });
  } catch (err: any) {
    console.error("[games:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}