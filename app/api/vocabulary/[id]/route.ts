import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({ name: z.string().min(2), language: z.string().min(2) });

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const set = await prisma.vocabularySet.findFirst({ where: { id: params.id, educatorId: profile!.id }, include: { items: true } });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(set);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const existing = await prisma.vocabularySet.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const set = await prisma.vocabularySet.update({ where: { id: params.id }, data: body.data });
  return NextResponse.json(set);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const existing = await prisma.vocabularySet.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const gamesUsing = await prisma.game.count({ where: { vocabularySetId: params.id } });
  if (gamesUsing > 0) return NextResponse.json({ error: "Set is used by games. Delete those games first." }, { status: 409 });
  await prisma.vocabularySet.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
