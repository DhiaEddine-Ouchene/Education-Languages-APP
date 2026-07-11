import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const subs = await prisma.subscription.findMany({
    where: status ? { status: status as never } : {},
    include: { educator: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(subs);
}
