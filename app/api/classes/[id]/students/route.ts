import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const cls = await prisma.class.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const members = await prisma.classMember.findMany({
    where: { classId: params.id },
    include: { student: { select: { id: true, name: true, email: true, xp: true } } },
  });
  return NextResponse.json(members);
}
