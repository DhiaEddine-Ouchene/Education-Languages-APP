import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const itemSchema = z.object({ word: z.string().min(1), translation: z.string().min(1), exampleSentence: z.string().optional().default("") });
const schema = z.object({ name: z.string().min(2), language: z.string().min(2), items: z.array(itemSchema).optional().default([]) });

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
    const { items, ...setData } = body.data;
    const set = await prisma.vocabularySet.create({
      data: {
        ...setData,
        educatorId: profile!.id,
        items: items.length > 0 ? { create: items } : undefined,
      },
    });
    return NextResponse.json(set, { status: 201 });
  } catch (err) {
    console.error("[vocabulary:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
