import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Students can read their own progress; educators can read their students' progress.
export async function GET(_: Request, { params }: { params: { studentId: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.id !== params.studentId && session.user.role !== "SUPER_ADMIN") {
    if (session.user.role !== "EDUCATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const teaches = await prisma.classMember.findFirst({
      where: { studentId: params.studentId, class: { educator: { userId: session.user.id } } },
    });
    if (!teaches) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const progress = await prisma.studentProgress.findMany({
    where: { studentId: params.studentId },
    include: { game: { select: { title: true, type: true } } },
    orderBy: { completedAt: "desc" },
  });
  return NextResponse.json(progress);
}
