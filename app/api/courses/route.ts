import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  type: z.string().min(1),
  content: z.string().optional().default(""),
});

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  language: z.string().min(2),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  coverImage: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
  lessons: z.array(lessonSchema).default([]),
});

export async function GET() {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const courses = await prisma.course.findMany({
      where: { educatorId: profile!.id },
      include: {
        _count: { select: { lessons: true, games: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(courses);
  } catch (err: any) {
    console.error("[courses:GET]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }

    const { lessons, ...data } = body.data;

    const course = await prisma.course.create({
      data: {
        ...data,
        coverImage: data.coverImage || null,
        educatorId: profile!.id,
        lessons: {
          create: lessons.map((l, i) => ({
            title: l.title,
            type: l.type,
            content: l.content || "",
            order: i,
          })),
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (err: any) {
    console.error("[courses:POST]", err);
    return NextResponse.json({ error: err.message || "Failed to create course" }, { status: 500 });
  }
}