import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  language: z.string().min(2),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  coverImage: z.string().optional().nullable(),
  price: z.number().min(0),
  isPublished: z.boolean(),
  isMarketplace: z.boolean(),
  lessons: z
    .array(z.object({ id: z.string().optional(), title: z.string(), type: z.string(), content: z.string(), order: z.number() }))
    .default([]),
});

async function owned(id: string, educatorId: string) {
  return prisma.course.findFirst({ where: { id, educatorId } });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const course = await prisma.course.findFirst({ where: { id: params.id, educatorId: profile!.id }, include: { lessons: { orderBy: { order: "asc" } } } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  if (!(await owned(params.id, profile!.id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    const { lessons, ...data } = body.data;
    const course = await prisma.$transaction(async (tx) => {
      const existing = await tx.lesson.findMany({ where: { courseId: params.id }, select: { id: true } });
      const existingIds = new Set(existing.map((l) => l.id));
      const incomingIds = new Set(lessons.filter((l) => l.id).map((l) => l.id as string));

      // Remove lessons the teacher deleted in this edit (cascades to their ExerciseSets, which is correct here)
      const idsToDelete = [...existingIds].filter((id) => !incomingIds.has(id));
      if (idsToDelete.length) {
        await tx.lesson.deleteMany({ where: { id: { in: idsToDelete } } });
      }

      // Update lessons that already exist (preserves id -> keeps their ExerciseSets), create the new ones
      for (const [i, l] of lessons.entries()) {
        if (l.id && existingIds.has(l.id)) {
          await tx.lesson.update({ where: { id: l.id }, data: { title: l.title, type: l.type, content: l.content, order: i } });
        } else {
          await tx.lesson.create({ data: { courseId: params.id, title: l.title, type: l.type, content: l.content, order: i } });
        }
      }

      return tx.course.update({ where: { id: params.id }, data: { ...data, coverImage: data.coverImage || null } });
    });
    return NextResponse.json(course);
  } catch (err) {
    console.error("[courses:PUT]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  if (!(await owned(params.id, profile!.id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
