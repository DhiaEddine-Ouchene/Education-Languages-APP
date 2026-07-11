import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

export async function GET() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const history = await prisma.subscription.findMany({ where: { educatorId: profile!.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(history);
}
