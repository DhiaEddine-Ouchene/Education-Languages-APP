import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";
import { sendNewAssignment } from "@/lib/mail";

const schema = z.object({ gameId: z.string().min(1), dueDate: z.string().min(1) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const [cls, game] = await Promise.all([
      prisma.class.findFirst({ where: { id: params.id, educatorId: profile!.id }, include: { members: { include: { student: true } } } }),
      prisma.game.findFirst({ where: { id: body.data.gameId, educatorId: profile!.id } }),
    ]);
    if (!cls || !game) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const due = new Date(body.data.dueDate);
    const assignment = await prisma.assignment.create({ data: { classId: cls.id, gameId: game.id, dueDate: due } });
    for (const m of cls.members) void sendNewAssignment(m.student.email, game.title, due);
    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    console.error("[classes:assign]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
