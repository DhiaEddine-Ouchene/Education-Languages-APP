import { NextResponse } from "next/server";
import { requireEducator } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { checkGamePublishLimit, checkGameTypeAllowed } from "@/lib/plan-guard";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const course = await prisma.course.findFirst({
      where: { id: params.id, educatorId: profile!.id },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const games = await prisma.game.findMany({
      where: {
        OR: [
          { courseId: params.id },
          { exerciseSet: { lesson: { courseId: params.id } } },
        ],
      },
      select: {
        id: true,
        title: true,
        type: true,
        isPublished: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ games }, { status: 200 });
  } catch (err: any) {
    console.error("[get-course-games]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch course games" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const course = await prisma.course.findFirst({
      where: { id: params.id, educatorId: profile!.id },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await req.json();

    if (body.action === "attach_existing") {
      const { gameIds } = body;
      if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
        return NextResponse.json({ error: "gameIds array is required" }, { status: 400 });
      }

      await prisma.game.updateMany({
        where: {
          id: { in: gameIds },
          educatorId: profile!.id,
        },
        data: {
          courseId: params.id,
        },
      });

      return NextResponse.json({ success: true, count: gameIds.length }, { status: 200 });
    }

    if (body.action === "create_game") {
      const { title, type, settings, isPublished } = body;
      if (!title || !type) {
        return NextResponse.json({ error: "Title and type are required" }, { status: 400 });
      }

      // Check game type allowed
      const typeCheck = await checkGameTypeAllowed(profile!.id, type);
      if (!typeCheck.allowed) {
        return NextResponse.json({ error: typeCheck.reason, requiresUpgrade: true }, { status: 403 });
      }

      // Check publish limit if published
      if (isPublished) {
        const publishCheck = await checkGamePublishLimit(profile!.id);
        if (!publishCheck.allowed) {
          return NextResponse.json(
            {
              error: `Published game limit reached (${publishCheck.limit} games max on Free). Upgrade to Pro for unlimited published games.`,
              requiresUpgrade: true,
              publishedCount: publishCheck.publishedCount,
              limit: publishCheck.limit,
            },
            { status: 403 }
          );
        }
      }

      const game = await prisma.game.create({
        data: {
          educatorId: profile!.id,
          courseId: params.id,
          title: title.trim(),
          type: type as any,
          settings: settings ?? {},
          isPublished: isPublished ?? false,
        },
      });

      return NextResponse.json({ success: true, game }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[attach-course-games]", err);
    return NextResponse.json({ error: err.message || "Failed to attach games" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const { gameId } = await req.json();
    if (!gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }

    await prisma.game.updateMany({
      where: {
        id: gameId,
        courseId: params.id,
        educatorId: profile!.id,
      },
      data: {
        courseId: null,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[detach-course-game]", err);
    return NextResponse.json({ error: err.message || "Failed to detach game" }, { status: 500 });
  }
}
