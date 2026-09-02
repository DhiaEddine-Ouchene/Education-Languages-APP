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
    include: { student: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(members);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const cls = await prisma.class.findFirst({
      where: { id: params.id, educatorId: profile!.id },
    });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const { email } = await req.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Student email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find student user by email or create new student account
    let student = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!student) {
      const nameFromEmail = cleanEmail.split("@")[0];
      student = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
          role: "STUDENT",
        },
      });
    }

    // Check if already in class
    const existing = await prisma.classMember.findUnique({
      where: {
        classId_studentId: {
          classId: params.id,
          studentId: student.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Student is already in this class" }, { status: 400 });
    }

    const member = await prisma.classMember.create({
      data: {
        classId: params.id,
        studentId: student.id,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, member });
  } catch (err: any) {
    console.error("[add-student]", err);
    return NextResponse.json({ error: err.message || "Failed to add student" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const cls = await prisma.class.findFirst({
      where: { id: params.id, educatorId: profile!.id },
    });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const { studentId } = await req.json();
    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    await prisma.classMember.deleteMany({
      where: {
        classId: params.id,
        studentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[remove-student]", err);
    return NextResponse.json({ error: err.message || "Failed to remove student" }, { status: 500 });
  }
}
