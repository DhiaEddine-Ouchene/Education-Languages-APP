import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/api";
import { sendFirstStudentJoined, sendWelcomeStudent } from "@/lib/mail";

const schema = z.object({ inviteCode: z.string().min(4) });

// Note: [id] is unused for join-by-code; route kept per spec. Also accessible via /api/classes/join.
export async function POST(req: Request) {
  const { error, session } = await requireStudent();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    const cls = await prisma.class.findUnique({
      where: { inviteCode: body.data.inviteCode.toUpperCase() },
      include: { educator: { include: { user: true } }, _count: { select: { members: true } } },
    });
    if (!cls) return NextResponse.json({ error: "Class not found for this code" }, { status: 404 });

    const existing = await prisma.classMember.findUnique({
      where: { classId_studentId: { classId: cls.id, studentId: session!.user.id } },
    });
    if (existing) return NextResponse.json({ error: "You already joined this class" }, { status: 409 });

    const member = await prisma.classMember.create({ data: { classId: cls.id, studentId: session!.user.id } });

    const student = await prisma.user.findUnique({ where: { id: session!.user.id } });
    if (student) {
      void sendWelcomeStudent(student.email, student.name);
      if (cls._count.members === 0) void sendFirstStudentJoined(cls.educator.user.email, cls.name, student.name);
    }
    return NextResponse.json({ id: member.id, className: cls.name }, { status: 201 });
  } catch (err) {
    console.error("[classes:join]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
