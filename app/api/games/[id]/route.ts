import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({
  title: z.string().min(3),
  type: z.enum(["FLASHCARD", "FILL_BLANK", "DRAG_DROP", "QUIZ", "DICTATION", "MEMORY", "SPEED_ROUND", "STORY"]),
  vocabularySetId: z.string().min(1),
  settings: z.record(z.unknown()).default({}),
  isPublished: z.boolean(),
  isMarketplace: z.boolean(),
  price: z.number().min(0),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const game = await prisma.game.findFirst({ where: { id: params.id, educatorId: profile!.id }, include: { vocabularySet: { include: { items: true } } } });
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(game);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const existing = await prisma.game.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    const game = await prisma.game.update({ where: { id: params.id }, data: { ...body.data, settings: body.data.settings as object } });
    return NextResponse.json(game);
  } catch (err) {
    console.error("[games:PUT]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const existing = await prisma.game.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.game.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
