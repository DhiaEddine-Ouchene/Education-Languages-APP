import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({
  title: z.string().min(3),
  type: z.enum(["FLASHCARD", "FILL_BLANK", "DRAG_DROP", "QUIZ", "DICTATION", "MEMORY", "SPEED_ROUND", "STORY"]),
  vocabularySetId: z.string().min(1),
  settings: z.record(z.unknown()).default({}),
  isPublished: z.boolean().default(false),
  isMarketplace: z.boolean().default(false),
  price: z.number().min(0).default(0),
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
    const set = await prisma.vocabularySet.findFirst({ where: { id: body.data.vocabularySetId, educatorId: profile!.id } });
    if (!set) return NextResponse.json({ error: "Vocabulary set not found" }, { status: 404 });
    const game = await prisma.game.create({ data: { ...body.data, settings: body.data.settings as object, educatorId: profile!.id } });
    return NextResponse.json(game, { status: 201 });
  } catch (err) {
    console.error("[games:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
