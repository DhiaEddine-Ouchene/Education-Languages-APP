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
  price: z.number().min(0).default(0),
  isPublished: z.boolean().default(false),
  isMarketplace: z.boolean().default(false),
  lessons: z.array(z.object({ title: z.string(), type: z.string(), content: z.string(), order: z.number() })).default([]),
});

export async function GET() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const courses = await prisma.course.findMany({ where: { educatorId: profile!.id }, include: { lessons: true }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    const { lessons, ...data } = body.data;
    const course = await prisma.course.create({
      data: { ...data, coverImage: data.coverImage || null, educatorId: profile!.id, lessons: { create: lessons } },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    console.error("[courses:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
