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
  lessons: z.array(z.object({ title: z.string(), type: z.string(), content: z.string(), order: z.number() })).default([]),
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
      await tx.lesson.deleteMany({ where: { courseId: params.id } });
      return tx.course.update({ where: { id: params.id }, data: { ...data, coverImage: data.coverImage || null, lessons: { create: lessons } } });
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
