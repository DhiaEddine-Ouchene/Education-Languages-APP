import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const game = await prisma.game.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.game.update({ where: { id: params.id }, data: { isPublished: !game.isPublished } });
  return NextResponse.json(updated);
}
