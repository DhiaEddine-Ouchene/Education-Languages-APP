import { NextResponse } from "next/server";
import { requireEducator } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generateGame } from "@/lib/generate-game";
import { checkAIGenerationLimit, incrementAIGenerationCount, checkGameTypeAllowed } from "@/lib/plan-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const { gameTypes } = await req.json();
    if (!gameTypes || !Array.isArray(gameTypes) || gameTypes.length === 0) {
      return NextResponse.json({ error: "gameTypes array is required" }, { status: 400 });
    }

    const course = await prisma.course.findFirst({
      where: { id: params.id, educatorId: profile!.id },
      include: { sources: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.sources.length === 0) {
      return NextResponse.json({ error: "No source files uploaded. Upload content first." }, { status: 400 });
    }

    // Check game types allowed
    for (const gt of gameTypes) {
      const typeCheck = await checkGameTypeAllowed(profile!.id, gt);
      if (!typeCheck.allowed) {
        return NextResponse.json(
          { error: typeCheck.reason, requiresUpgrade: true },
          { status: 403 }
        );
      }
    }

    // Check AI generation limit
    const limit = await checkAIGenerationLimit(profile!.id);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Monthly AI generation limit reached. Upgrade to Pro for unlimited AI games.",
          remaining: 0,
          resetAt: limit.resetAt?.toISOString() ?? null,
        },
        { status: 429 }
      );
    }

    // Concatenate all source texts
    const combinedText = course.sources.map((s) => s.extractedText).join("\n\n");

    const games = [];
    const errors = [];

    for (const gameType of gameTypes) {
      try {
        const result = await generateGame(gameType, combinedText, 10, {
          targetLang: course.language,
          nativeLang: "English",
          educatorId: profile!.id,
        });

        if (result.status === "needs_review") {
          errors.push({
            gameType,
            error: result.error,
            rawData: result.data,
          });
          continue;
        }

        // Increment AI generation count
        await incrementAIGenerationCount(profile!.id);

        // Create a Lesson as intermediate bridge (required by schema)
        const lesson = await prisma.lesson.create({
          data: {
            courseId: params.id,
            title: `${gameType.replace(/_/g, " ")} Content`,
            type: "generated",
            content: `Generated from course sources`,
            order: 0,
          },
        });

        // Create ExerciseSet
        const exerciseSet = await prisma.exerciseSet.create({
          data: {
            lessonId: lesson.id,
            anex: "VOCABULARY", // Default, not critical for generated games
            language: course.language,
            level: course.level,
            items: result.data as object,
            generatedBy: "groq",
          },
        });

        // Create Game
        const game = await prisma.game.create({
          data: {
            educatorId: profile!.id,
            title: `${course.title} – ${gameType.replace(/_/g, " ")}`,
            type: gameType as any,
            exerciseSetId: exerciseSet.id,
            settings: { generated: result.data } as object,
            isPublished: false,
            generationStatus: "ready",
          },
        });

        games.push({
          id: game.id,
          title: game.title,
          type: game.type,
          status: "ready",
        });
      } catch (err: any) {
        console.error(`[generate-games] Error generating ${gameType}:`, err);
        errors.push({
          gameType,
          error: err.message || "Generation failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      games,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 200 });
  } catch (err: any) {
    console.error("[generate-games]", err);
    return NextResponse.json({ error: err.message || "Generation failed" }, { status: 500 });
  }
}
