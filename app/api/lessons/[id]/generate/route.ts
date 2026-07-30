import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";
import { generateGame } from "@/lib/generate-game";

const schema = z.object({
  anex: z.enum(["VOCABULARY", "GRAMMAR", "LISTENING_WRITING", "SPEAKING"]),
});

// Map Anex types to GameTypes for generateGame
const ANEX_TO_GAME_TYPE: Record<string, string> = {
  VOCABULARY: "FLASHCARD",
  GRAMMAR: "QUIZ",
  LISTENING_WRITING: "STORY",
  SPEAKING: "DICTATION",
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: params.id, course: { educatorId: profile!.id } },
    include: { course: true },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  if (!lesson.content.trim()) {
    return NextResponse.json({ error: "Lesson has no content to generate from" }, { status: 400 });
  }

  const gameType = ANEX_TO_GAME_TYPE[body.data.anex];
  if (!gameType) {
    return NextResponse.json({ error: `Generation for ${body.data.anex} is not implemented yet` }, { status: 501 });
  }

  try {
    // Use generateGame to produce structured content from the lesson text
    const result = await generateGame(gameType, lesson.content, 10, {
      targetLang: lesson.course.language,
      nativeLang: "English",
      educatorId: profile!.id,
    });

    if (result.status === "needs_review") {
      // If generation failed, return the raw output for manual review
      return NextResponse.json({
        status: "needs_review",
        error: result.error,
        rawData: result.data,
      }, { status: 422 });
    }

    const exerciseSet = await prisma.exerciseSet.create({
      data: {
        lessonId: lesson.id,
        anex: body.data.anex,
        language: lesson.course.language,
        level: lesson.course.level,
        items: result.data as object,
        generatedBy: "groq",
      },
    });

    return NextResponse.json({ ...exerciseSet, wordSetId: result.wordSetId }, { status: 201 });
  } catch (err) {
    console.error("[lessons:generate:POST]", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
