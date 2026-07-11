import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  audioUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  exampleSentence: z.string().optional().nullable(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const set = await prisma.vocabularySet.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const item = await prisma.vocabularyItem.create({
      data: {
        setId: params.id,
        word: body.data.word,
        translation: body.data.translation,
        audioUrl: body.data.audioUrl || null,
        imageUrl: body.data.imageUrl || null,
        exampleSentence: body.data.exampleSentence || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[vocabulary:items:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
