import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({
  title: z.string().min(3),
  type: z.enum([
    "FLASHCARD", "FILL_BLANK", "DRAG_DROP", "QUIZ", "DICTATION", "MEMORY", "SPEED_ROUND", "STORY",
    "SYNONYM_ANTONYM", "FILL_GAP_WORD", "WORD_MEANING_MATCH", "SITUATION_DIALOGUE_FILL",
    "WORD_IN_CONTEXT", "WORD_SCRAMBLE", "ODD_ONE_OUT",
    "SENTENCE_BUILDER", "ERROR_SPOTTING", "FILL_BLANK_GRAMMAR", "VERB_CONJUGATION", "MULTIPLE_CHOICE_GRAMMAR",
    "LISTEN_FILL_WORD", "LISTEN_FILL_SENTENCE", "SPEAK_FILL_WORD", "SPEAK_FILL_SENTENCE",
    "CROSSWORD", "COLLOCATION_BUILDER", "FLASHCARD_3D", "MINIMAL_PAIR", "PICTURE_TO_WORD",
  ]),
  vocabularySetId: z.string().min(1).optional().nullable(),
  settings: z.record(z.unknown()).default({}),
  isPublished: z.boolean().default(false),
  isMarketplace: z.boolean().default(false),
  price: z.number().min(0).default(0),
  builderData: z.record(z.unknown()).optional(),
});

export async function GET() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const games = await prisma.game.findMany({ where: { educatorId: profile!.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(games);
}

export async function POST(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });

    // If vocabularySetId is provided, validate ownership
    if (body.data.vocabularySetId) {
      const set = await prisma.vocabularySet.findFirst({ where: { id: body.data.vocabularySetId, educatorId: profile!.id } });
      if (!set) return NextResponse.json({ error: "Vocabulary set not found" }, { status: 404 });
    }

    const game = await prisma.game.create({
      data: {
        title: body.data.title,
        type: body.data.type as any,
        vocabularySetId: body.data.vocabularySetId || null,
        settings: body.data.settings as object,
        isPublished: body.data.isPublished,
        isMarketplace: body.data.isMarketplace,
        price: body.data.price,
        educatorId: profile!.id,
      },
    });

    // Create type-specific relational models if builderData is provided
    const bd = body.data.builderData;
    if (bd && typeof bd === "object") {
      const type = body.data.type;

      // Flashcard-type games (word pairs)
      if (["FLASHCARD","WORD_SCRAMBLE","PICTURE_TO_WORD","COLLOCATION_BUILDER","FLASHCARD_3D","ODD_ONE_OUT","MEMORY","WORD_MEANING_MATCH","MINIMAL_PAIR","SPEED_ROUND"].includes(type)) {
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

      // Synonym & Antonym
      if (type === "SYNONYM_ANTONYM") {
        const synonymItems = (bd.synonymItems as any[]) || [];
        if (synonymItems.length > 0) {
          const existingSettings = (game.settings as Record<string, any>) || {};
          await prisma.game.update({
            where: { id: game.id },
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
      }

      // Sentence-fill-type games — store in settings JSON since no dedicated model
      if (["FILL_GAP_WORD","FILL_BLANK","FILL_BLANK_GRAMMAR","DRAG_DROP","SITUATION_DIALOGUE_FILL","SENTENCE_BUILDER","LISTEN_FILL_WORD","LISTEN_FILL_SENTENCE","SPEAK_FILL_WORD","SPEAK_FILL_SENTENCE","DICTATION"].includes(type)) {
        const sentenceItems = (bd.sentenceItems as any[]) || [];
        if (sentenceItems.length > 0) {
          // Merge sentence items into game settings
          const existingSettings = (game.settings as Record<string, any>) || {};
          await prisma.game.update({
            where: { id: game.id },
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
      }

      // Quiz-type games
      if (["QUIZ","MULTIPLE_CHOICE_GRAMMAR","ERROR_SPOTTING","WORD_IN_CONTEXT"].includes(type)) {
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

      // Crossword
      if (type === "CROSSWORD") {
        await prisma.crosswordData.create({
          data: {
            gameId: game.id,
            gridSize: (bd.gridSize as number) || 8,
            words: JSON.parse(JSON.stringify(bd.words || [])),
          },
        });
      }

      // Verb Conjugation
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

      // Story
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

    // Fetch the game again with its type-specific data
    const gameWithData = await prisma.game.findUnique({
      where: { id: game.id },
      include: {
        flashcardData: { include: { pairs: { orderBy: { order: "asc" } } } },
        quizData: { include: { questions: { orderBy: { order: "asc" } } } },
        crosswordData: true,
        verbConjugationData: true,
        storyData: true,
      },
    });

    return NextResponse.json(gameWithData || game, { status: 201 });
  } catch (err) {
    console.error("[games:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
