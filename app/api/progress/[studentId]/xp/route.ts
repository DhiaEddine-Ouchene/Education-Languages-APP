import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { levelThreshold } from "@/lib/xp";

export async function GET(_: Request, { params }: { params: { studentId: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const xp = await prisma.studentXP.findUnique({ where: { studentId: params.studentId } });
  const level = xp?.level ?? 1;
  return NextResponse.json({
    totalXP: xp?.totalXP ?? 0, level, streak: xp?.streak ?? 0,
    nextLevelXP: levelThreshold(level + 1), lastActiveDate: xp?.lastActiveDate ?? null,
  });
}
