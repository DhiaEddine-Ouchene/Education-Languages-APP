import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as never } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    include: { educatorProfile: { select: { subscriptionPlan: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(users);
}
