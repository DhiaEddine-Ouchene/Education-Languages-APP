import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/api";
import { awardGameResult, checkClassChampion } from "@/lib/xp";
import { sendLevelUp, sendBadgeEarned } from "@/lib/mail";

const schema = z.object({ score: z.number().min(0).max(100), timeTaken: z.number().min(0).max(60 * 60) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireStudent();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const game = await prisma.game.findUnique({ where: { id: params.id } });
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const result = await awardGameResult({
      studentId: session!.user.id,
      gameId: game.id,
      score: body.data.score,
      timeTaken: body.data.timeTaken,
      gameType: game.type,
    });

    // Class Champion badge check across student's classes
    const memberships = await prisma.classMember.findMany({ where: { studentId: session!.user.id }, select: { classId: true } });
    for (const m of memberships) {
      const champ = await checkClassChampion(session!.user.id, m.classId);
      if (champ) result.newBadges.push(champ);
    }

    // Email notifications (fire and forget)
    const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
    if (user) {
      if (result.leveledUp) void sendLevelUp(user.email, result.level);
      for (const b of result.newBadges) void sendBadgeEarned(user.email, b);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[games:play]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
