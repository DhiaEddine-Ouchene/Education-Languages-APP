import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";
import { generateVocabularySet, generateGrammarSet } from "@/lib/gemini";

const schema = z.object({
  anex: z.enum(["VOCABULARY", "GRAMMAR", "LISTENING_WRITING", "SPEAKING"]),
});

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

  // Each anex has its own generator in lib/gemini.ts. LISTENING_WRITING and
  // SPEAKING aren't implemented yet — they need audio/TTS handling first.
  const generators: Partial<Record<typeof body.data.anex, () => Promise<unknown[]>>> = {
    VOCABULARY: () =>
      generateVocabularySet({ lessonContent: lesson.content, language: lesson.course.language, level: lesson.course.level }),
    GRAMMAR: () =>
      generateGrammarSet({ lessonContent: lesson.content, language: lesson.course.language, level: lesson.course.level }),
  };

  const generate = generators[body.data.anex];
  if (!generate) {
    return NextResponse.json({ error: `Generation for ${body.data.anex} is not implemented yet` }, { status: 501 });
  }

  try {
    const items = await generate();

    const exerciseSet = await prisma.exerciseSet.create({
      data: {
        lessonId: lesson.id,
        anex: body.data.anex,
        language: lesson.course.language,
        level: lesson.course.level,
        items: items as unknown as object,
      },
    });

    return NextResponse.json(exerciseSet, { status: 201 });
  } catch (err) {
    console.error("[lessons:generate:POST]", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
