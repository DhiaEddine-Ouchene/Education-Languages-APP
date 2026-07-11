import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({ name: z.string().min(2), language: z.string().min(2) });

export async function GET() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const sets = await prisma.vocabularySet.findMany({ where: { educatorId: profile!.id }, include: { items: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(sets);
}

export async function POST(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const set = await prisma.vocabularySet.create({ data: { ...body.data, educatorId: profile!.id } });
    return NextResponse.json(set, { status: 201 });
  } catch (err) {
    console.error("[vocabulary:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
