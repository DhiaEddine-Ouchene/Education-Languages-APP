import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateGame } from "@/lib/generate-game";
import {
  checkAIGenerationLimit,
  incrementAIGenerationCount,
} from "@/lib/plan-guard";

export async function POST(req: Request) {
  try {
    const session = await requireRole("EDUCATOR");
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const educator = await prisma.educatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!educator) {
      return NextResponse.json({ error: "Educator profile not found" }, { status: 404 });
    }

    // ── Check AI generation limit ──
    const limit = await checkAIGenerationLimit(educator.id);
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetLanguage = formData.get("language") as string | null;
    const level = formData.get("level") as string | null;
    const category = formData.get("category") as string | null;
    const gameType = formData.get("gameType") as string | null;

    if (!file || !targetLanguage || !level || !category || !gameType) {
      return NextResponse.json(
        { error: "Missing required fields (file, language, level, category, gameType)" },
        { status: 400 }
      );
    }

    // Convert file to buffer and extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (file.type === "application/pdf") {
      try {
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } catch (e: any) {
        console.error("PDF Parse error:", e);
        throw new Error(`Failed to extract text from PDF: ${e.message}`);
      }
    } else if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8");
    } else {
      throw new Error("Unsupported file type. Please upload a PDF or text file.");
    }

    if (!extractedText.trim()) {
      throw new Error("No text found in the uploaded document.");
    }

    // Use generateGame instead of the old groq functions
    const result = await generateGame(gameType, extractedText, 10, {
      targetLang: targetLanguage,
      nativeLang: "English",
      educatorId: educator.id,
    });

    if (result.status === "needs_review") {
      return NextResponse.json({
        success: false,
        status: "needs_review",
        error: result.error,
        rawData: result.data,
      }, { status: 422 });
    }

    // ── Increment counter after successful generation ──
    await incrementAIGenerationCount(educator.id);

    // ── Save results in a transaction ──
    const saveResult = await prisma.$transaction(async (tx) => {
      const game = await tx.game.create({
        data: {
          educatorId: educator.id,
          title: `${targetLanguage} ${level} – ${gameType.replace(/_/g, " ")}`,
          type: gameType as any,
          vocabularySetId: result.wordSetId || null,
          settings: { generated: result.data } as object,
          isPublished: false,
          generationStatus: "ready",
        },
      });
      return { gameId: game.id, title: game.title };
    });

    return NextResponse.json({ success: true, data: saveResult }, { status: 200 });

  } catch (err: any) {
    console.error("[generate-course-content]", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
