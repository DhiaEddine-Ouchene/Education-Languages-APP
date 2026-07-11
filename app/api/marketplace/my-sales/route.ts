import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

export async function GET() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const sales = await prisma.marketplacePurchase.findMany({
    where: { OR: [{ course: { educatorId: profile!.id } }, { game: { educatorId: profile!.id } }] },
    include: { course: { select: { title: true } }, game: { select: { title: true } }, buyer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const total = sales.reduce((s, p) => s + p.amount, 0);
  return NextResponse.json({ sales, total, creatorShare: total * 0.75 });
}
