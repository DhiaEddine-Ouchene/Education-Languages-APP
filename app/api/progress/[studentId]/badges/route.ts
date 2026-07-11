import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: { studentId: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const badges = await prisma.studentBadge.findMany({
    where: { studentId: params.studentId },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });
  return NextResponse.json(badges);
}
