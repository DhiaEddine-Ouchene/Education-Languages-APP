import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const course = await prisma.course.findFirst({
    where: { id: params.id, isPublished: true, isMarketplace: true, approved: true },
    include: { lessons: { select: { title: true, type: true } }, educator: { select: { brandName: true, user: { select: { name: true } } } } },
  });
  if (course) return NextResponse.json({ kind: "course", item: course });
  const game = await prisma.game.findFirst({
    where: { id: params.id, isPublished: true, isMarketplace: true, approved: true },
    include: { educator: { select: { brandName: true, user: { select: { name: true } } } } },
  });
  if (game) return NextResponse.json({ kind: "game", item: game });
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
