import { NextResponse } from "next/server";
import { requireEducator } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generateGame } from "@/lib/generate-game";

export async function POST(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const { gameId, sourceContent, count, targetLang, nativeLang } = await req.json();
    if (!gameId || !sourceContent) {
      return NextResponse.json({ error: "gameId and sourceContent are required" }, { status: 400 });
    }

    // Fetch the game and verify ownership
    const game = await prisma.game.findFirst({ where: { id: gameId, educatorId: profile!.id } });
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    // Generate new content
    const result = await generateGame(
      game.type,
      sourceContent,
      count || 8,
      { targetLang, nativeLang }
    );

    if (result.status === "ready") {
      const updatedSettings = { ...(game.settings as Record<string, unknown>), generated: result.data };
      await prisma.game.update({
        where: { id: gameId },
        data: {
          settings: updatedSettings as object,
          generationStatus: "ready",
          generationError: null,
          generationRaw: undefined,
        },
      });
      return NextResponse.json({ success: true, data: result.data });
    } else {
      // Save the raw output for review
      await prisma.game.update({
        where: { id: gameId },
        data: {
          generationStatus: "needs_review",
          generationError: result.error,
          generationRaw: (result.data as object) || undefined,
        },
      });
      return NextResponse.json({ success: false, status: "needs_review", error: result.error });
    }
  } catch (err: any) {
    console.error("[games/regenerate]", err);
    return NextResponse.json({ error: err.message || "Regeneration failed" }, { status: 500 });
  }
}
