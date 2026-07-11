import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

const schema = z.object({ kind: z.enum(["course", "game"]) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  try {
    if (body.data.kind === "course") {
      await prisma.course.update({ where: { id: params.id }, data: { approved: true, rejectReason: null } });
    } else {
      await prisma.game.update({ where: { id: params.id }, data: { approved: true, rejectReason: null } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
}
