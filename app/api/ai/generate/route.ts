import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generateCourseContentGroq } from "@/lib/groq";
import { prisma } from "@/lib/prisma";

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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetLanguage = formData.get("language") as string | null;
    const level = formData.get("level") as string | null;

    if (!file || !targetLanguage || !level) {
      return NextResponse.json(
        { error: "Missing required fields (file, language, level)" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (file.type === "application/pdf") {
      try {
        // pdf-parse is in serverExternalPackages (next.config.mjs) so require works
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

    // Call Groq to generate the content
    const generatedData = await generateCourseContentGroq(
      extractedText,
      targetLanguage,
      level
    );

    // Ensure we run this in a transaction to prevent partial creations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Vocabulary Set
      const vocabSet = await tx.vocabularySet.create({
        data: {
          educatorId: educator.id,
          name: generatedData.vocabularySet.name,
          language: targetLanguage,
          items: {
            create: generatedData.vocabularySet.items.map((item) => ({
              word: item.word,
              translation: item.translation,
              exampleSentence: item.exampleSentence,
            })),
          },
        },
      });

      const createdGames = [];
      
      for (const gameData of generatedData.games) {
        // Map annexes from string to Anex enum
        let mappedAnex = "VOCABULARY"; // fallback
        if (gameData.anex === "VOCABULARY" || gameData.anex === "GRAMMAR" || gameData.anex === "LISTENING_WRITING" || gameData.anex === "SPEAKING") {
           mappedAnex = gameData.anex;
        }
        
        const game = await tx.game.create({
          data: {
            educatorId: educator.id,
            title: gameData.title,
            type: gameData.type as any, // Cast to any to bypass strict enum check
            vocabularySetId: vocabSet.id,
            settings: gameData.settings,
            isPublished: false,
          },
        });
        createdGames.push(game);
      }

      return { vocabSet, games: createdGames };
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });

  } catch (err: any) {
    console.error("[generate-course-content]", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
