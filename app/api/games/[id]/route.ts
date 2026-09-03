import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

import { checkGamePublishLimit, checkGameTypeAllowed } from "@/lib/plan-guard";

const schema = z.object({
  title: z.string().min(3),
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

async function owned(id: string, educatorId: string) {
  return prisma.game.findFirst({ where: { id, educatorId } });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const game = await prisma.game.findFirst({
    where: { id: params.id, educatorId: profile!.id },
    include: {
      flashcardData: { include: { pairs: true } },
      quizData: { include: { questions: true } },
      crosswordData: true,
      verbConjugationData: true,
      storyData: true,
    },
  });
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(game);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const existingGame = await owned(params.id, profile!.id);
  if (!existingGame) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });

    // ── Check game type allowed ──
    const typeCheck = await checkGameTypeAllowed(profile!.id, body.data.type);
    if (!typeCheck.allowed) {
      return NextResponse.json({ error: typeCheck.reason, requiresUpgrade: true }, { status: 403 });
    }

    // ── Check publish limit if transitioning from draft to published ──
    if (body.data.isPublished && !existingGame.isPublished) {
      const publishCheck = await checkGamePublishLimit(profile!.id);
      if (!publishCheck.allowed) {
        return NextResponse.json(
          {
            error: `Published game limit reached (${publishCheck.limit} games max on Free). Upgrade to Pro for unlimited published games.`,
            requiresUpgrade: true,
            publishedCount: publishCheck.publishedCount,
            limit: publishCheck.limit,
          },
          { status: 403 }
        );
      }
    }

    const game = await prisma.game.update({
      where: { id: params.id },
      data: {
        title: body.data.title,
        type: body.data.type as any,
        settings: body.data.settings as object,
        isPublished: body.data.isPublished,
        courseId: body.data.courseId || undefined,
      },
    });

    // Handle type-specific content via builderData
    const bd = body.data.builderData;
    if (bd && typeof bd === "object") {
      const type = body.data.type;

      // Flashcard-type games (word pairs)
      if (["FLASHCARD","WORD_SCRAMBLE","PICTURE_TO_WORD","FLASHCARD_3D","MEMORY","MINIMAL_PAIR","SPEED_ROUND"].includes(type)) {
        const pairs = (bd.pairs as any[]) || [];
        await prisma.flashcardData.deleteMany({ where: { gameId: params.id } });
        if (pairs.length > 0) {
          await prisma.flashcardData.create({
            data: {
              gameId: params.id,
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

      // Synonym & Antonym
      if (type === "SYNONYM_ANTONYM") {
        const synonymItems = (bd.synonymItems as any[]) || [];
        const existingSettings = (game.settings as Record<string, any>) || {};
        await prisma.game.update({
          where: { id: params.id },
          data: {
            settings: {
              ...existingSettings,
              synonymItems: synonymItems.map((s: any, i: number) => ({
                word: s.word || "",
                synonym: s.synonym || "",
                antonym: s.antonym || "",
                order: i,
              })),
            },
          },
        });
      }

      // Sentence-fill-type games — store in settings JSON
      if (["FILL_GAP_WORD","FILL_BLANK","DRAG_DROP","SITUATION_DIALOGUE_FILL","SENTENCE_BUILDER","LISTEN_FILL_WORD","LISTEN_FILL_SENTENCE","SPEAK_FILL_WORD","SPEAK_FILL_SENTENCE","DICTATION"].includes(type)) {
        const sentenceItems = (bd.sentenceItems as any[]) || [];
        const existingSettings = (game.settings as Record<string, any>) || {};
        await prisma.game.update({
          where: { id: params.id },
          data: {
            settings: {
              ...existingSettings,
              sentenceItems: sentenceItems.map((s: any, i: number) => ({
                sentence: s.sentence || "",
                correctAnswer: s.correctAnswer || "",
                options: s.options || [],
                order: i,
              })),
            },
          },
        });
      }

      // Quiz-type games
      if (["QUIZ","MULTIPLE_CHOICE_GRAMMAR","ERROR_SPOTTING"].includes(type)) {
        const questions = (bd.questions as any[]) || [];
        await prisma.quizData.deleteMany({ where: { gameId: params.id } });
        if (questions.length > 0) {
          await prisma.quizData.create({
            data: {
              gameId: params.id,
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

      // Crossword
      if (type === "CROSSWORD") {
        await prisma.crosswordData.deleteMany({ where: { gameId: params.id } });
        await prisma.crosswordData.create({
          data: {
            gameId: params.id,
            gridSize: (bd.gridSize as number) || 8,
            words: JSON.parse(JSON.stringify(bd.words || [])),
          },
        });
      }

      // Verb Conjugation
      if (type === "VERB_CONJUGATION") {
        await prisma.verbConjugationData.deleteMany({ where: { gameId: params.id } });
        await prisma.verbConjugationData.create({
          data: {
            gameId: params.id,
            verb: (bd.verb as string) || "",
            tense: (bd.tense as string) || "Present",
            forms: JSON.parse(JSON.stringify(bd.forms || {})),
          },
        });
      }

      // Story
      if (type === "STORY") {
        await prisma.storyData.deleteMany({ where: { gameId: params.id } });
        await prisma.storyData.create({
          data: {
            gameId: params.id,
            prompt: (bd.prompt as string) || "",
            wordBank: bd.wordBank ? JSON.parse(JSON.stringify(bd.wordBank)) : null,
            template: (bd.template as string) || null,
          },
        });
      }

      // Ported engines — store rich content in settings JSON
      if (type === "CATEGORY_SORT") {
        const existingSettings = (game.settings as Record<string, any>) || {};
        await prisma.game.update({
          where: { id: params.id },
          data: {
            settings: {
              ...existingSettings,
              sortCategories: (bd.sortCategories as string[]) || [],
              sortItems: (bd.sortItems as any[]) || [],
            },
          },
        });
      }

      if (type === "TRANSFORMATION") {
        const existingSettings = (game.settings as Record<string, any>) || {};
        await prisma.game.update({
          where: { id: params.id },
          data: {
            settings: {
              ...existingSettings,
              transformationItems: ((bd.transformationItems as any[]) || []).map((t: any) => ({
                instruction: t.instruction || "",
                prompt: t.prompt || "",
                answers: t.answers || [],
              })),
            },
          },
        });
      }

      if (type === "WRITING_RUBRIC") {
        const existingSettings = (game.settings as Record<string, any>) || {};
        await prisma.game.update({
          where: { id: params.id },
          data: {
            settings: {
              ...existingSettings,
              writingData: {
                prompt: (bd.prompt as string) || "",
                wordBank: (bd.wordBank as string[]) || [],
                starter: (bd.starter as string) || "",
                note: (bd.note as string) || "",
                teacherReview: !!bd.teacherReview,
                rules: (bd.rules as any[]) || [],
              },
            },
          },
        });
      }

      if (type === "SPEAKING") {
        const existingSettings = (game.settings as Record<string, any>) || {};
        await prisma.game.update({
          where: { id: params.id },
          data: {
            settings: {
              ...existingSettings,
              speakingItems: (bd.speakingItems as any[]) || [],
            },
          },
        });
      }

      // Situational dialogue — real conversation with named speakers
      if (type === "SITUATION_DIALOGUE_FILL") {
        const existingSettings = (game.settings as Record<string, any>) || {};
        await prisma.game.update({
          where: { id: params.id },
          data: {
            settings: {
              ...existingSettings,
              dialogueItems: (bd.dialogueItems as any[]) || [],
            },
          },
        });
      }
    }

    // Return updated game
    const updatedGame = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        flashcardData: { include: { pairs: true } },
        quizData: { include: { questions: true } },
        crosswordData: true,
        verbConjugationData: true,
        storyData: true,
      },
    });

    return NextResponse.json(updatedGame);
  } catch (err) {
    console.error("[games:PUT]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  if (!(await owned(params.id, profile!.id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.game.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
