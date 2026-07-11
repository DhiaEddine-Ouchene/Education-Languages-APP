import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const [courses, games] = await Promise.all([
    prisma.course.findMany({ where: { isMarketplace: true, approved: false, rejectReason: null }, include: { educator: { include: { user: { select: { name: true } } } } } }),
    prisma.game.findMany({ where: { isMarketplace: true, approved: false, rejectReason: null }, include: { educator: { include: { user: { select: { name: true } } } } } }),
  ]);
  return NextResponse.json({ courses, games });
}
