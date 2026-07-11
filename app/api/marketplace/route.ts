import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") ?? undefined;
  const level = searchParams.get("level") ?? undefined;

  const [courses, games] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true, isMarketplace: true, approved: true, ...(language ? { language } : {}), ...(level ? { level: level as never } : {}) },
      include: { educator: { select: { brandName: true, user: { select: { name: true } } } }, _count: { select: { purchases: true } } },
      take: 50,
    }),
    prisma.game.findMany({
      where: { isPublished: true, isMarketplace: true, approved: true },
      include: { educator: { select: { brandName: true, user: { select: { name: true } } } }, _count: { select: { purchases: true } } },
      take: 50,
    }),
  ]);
  return NextResponse.json({ courses, games });
}
