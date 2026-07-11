import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/api";
import { awardGameResult } from "@/lib/xp";

const schema = z.object({ gameId: z.string().min(1), score: z.number().min(0).max(100), timeTaken: z.number().min(0) });

export async function POST(req: Request) {
  const { error, session } = await requireStudent();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const game = await prisma.game.findUnique({ where: { id: body.data.gameId } });
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    const result = await awardGameResult({
      studentId: session!.user.id, gameId: game.id,
      score: body.data.score, timeTaken: body.data.timeTaken, gameType: game.type,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[progress:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
