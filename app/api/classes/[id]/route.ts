import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2),
  language: z.string().min(2),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const cls = await prisma.class.findFirst({
    where: { id: params.id, educatorId: profile!.id },
    include: { members: { include: { student: { select: { id: true, name: true, email: true } } } }, assignments: { include: { game: true } } },
  });
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cls);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const existing = await prisma.class.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const cls = await prisma.class.update({ where: { id: params.id }, data: body.data });
  return NextResponse.json(cls);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const existing = await prisma.class.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.class.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
