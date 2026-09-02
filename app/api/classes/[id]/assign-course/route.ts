import { NextResponse } from "next/server";
import { requireEducator } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const { courseId, dueDate } = await req.json();
    if (!courseId || !dueDate) {
      return NextResponse.json({ error: "courseId and dueDate are required" }, { status: 400 });
    }

    const cls = await prisma.class.findFirst({
      where: { id: params.id, educatorId: profile!.id },
    });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId, educatorId: profile!.id },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Find all games linked to this course directly or via Lesson -> ExerciseSet -> Game
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { courseId },
          { exerciseSet: { lesson: { courseId } } },
        ],
        educatorId: profile!.id,
      },
    });

    if (games.length === 0) {
      return NextResponse.json({ error: "No games found for this course" }, { status: 400 });
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return NextResponse.json({ error: "Invalid dueDate format" }, { status: 400 });
    }

    // Create assignments for each game
    const assignments = await Promise.all(
      games.map((game) =>
        prisma.assignment.create({
          data: {
            classId: params.id,
            gameId: game.id,
            dueDate: parsedDueDate,
            isLive: false,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      assignedCount: assignments.length,
    }, { status: 200 });
  } catch (err: any) {
    console.error("[assign-course]", err);
    return NextResponse.json({ error: err.message || "Failed to assign course" }, { status: 500 });
  }
}
