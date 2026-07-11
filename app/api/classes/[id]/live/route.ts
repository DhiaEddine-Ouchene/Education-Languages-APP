import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({ gameId: z.string().min(1) });

// Starts a live session: creates a live assignment due in 1 hour.
// Students see it flagged at the top of their home and play in real time.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const [cls, game] = await Promise.all([
      prisma.class.findFirst({ where: { id: params.id, educatorId: profile!.id } }),
      prisma.game.findFirst({ where: { id: body.data.gameId, educatorId: profile!.id } }),
    ]);
    if (!cls || !game) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // End any previous live session for this class
    await prisma.assignment.updateMany({ where: { classId: cls.id, isLive: true }, data: { isLive: false } });
    const due = new Date(Date.now() + 60 * 60 * 1000);
    const assignment = await prisma.assignment.create({ data: { classId: cls.id, gameId: game.id, dueDate: due, isLive: true } });
    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    console.error("[classes:live]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
