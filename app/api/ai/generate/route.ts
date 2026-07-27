import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generateCourseContentGroq, generateVocabularySet, generateGrammarSet } from "@/lib/groq";
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

    // ── Step 1: Call AI OUTSIDE the transaction (AI calls can take 10-30s) ──
    let vocabItems: any[] | null = null;
    let grammarItems: any[] | null = null;
    let genericResult: any | null = null;

    if (category === "vocabulary") {
      vocabItems = await generateVocabularySet({
        lessonContent: extractedText,
        language: targetLanguage,
        level,
      });
    } else if (category === "grammar") {
      grammarItems = await generateGrammarSet({
        lessonContent: extractedText,
        language: targetLanguage,
        level,
      });
    } else if (category === "listening" || category === "writing") {
      // For listening/writing, use the generic course content generator
      genericResult = await generateCourseContentGroq(extractedText, targetLanguage, level);
    } else {
      throw new Error("Unknown category: " + category);
    }

    // ── Step 2: Save results in a fast transaction ──
    const result = await prisma.$transaction(async (tx) => {
      let vocabSetId: string | null = null;
      let gameSettings: any = {};
      let title = "";

      if (category === "vocabulary" && vocabItems) {
        const vocabSet = await tx.vocabularySet.create({
          data: {
            educatorId: educator.id,
            name: `Vocabulary for ${targetLanguage} ${level}`,
            language: targetLanguage,
            items: {
              create: vocabItems.map((item) => ({
                word: item.word,
                translation: item.translation,
                exampleSentence: item.exampleSentence,
              })),
            },
          },
        });
        vocabSetId = vocabSet.id;
        gameSettings = { items: vocabItems };
        title = `${targetLanguage} ${level} – ${gameType.replace(/_/g, " ")}`;

      } else if (category === "grammar" && grammarItems) {
        const relevantItems = grammarItems.filter((i) => i.gameType === gameType);
        gameSettings = { items: relevantItems.length > 0 ? relevantItems : grammarItems };
        title = `${targetLanguage} ${level} – ${gameType.replace(/_/g, " ")}`;

      } else if ((category === "listening" || category === "writing") && genericResult) {
        // Use the generic result — extract games matching the requested type
        const matchingGames = genericResult.games?.filter((g: any) => g.type === gameType) || [];
        gameSettings = matchingGames.length > 0 ? matchingGames[0].settings : (genericResult.games?.[0]?.settings || {});
        title = matchingGames.length > 0 ? matchingGames[0].title : `${targetLanguage} ${level} – ${gameType.replace(/_/g, " ")}`;
        
        // Also save the vocabulary set if present
        if (genericResult.vocabularySet?.items?.length > 0) {
          const vocabSet = await tx.vocabularySet.create({
            data: {
              educatorId: educator.id,
              name: genericResult.vocabularySet.name || `Vocab for ${targetLanguage}`,
              language: targetLanguage,
              items: {
                create: genericResult.vocabularySet.items.map((item: any) => ({
                  word: item.word,
                  translation: item.translation,
                  exampleSentence: item.exampleSentence || "",
                })),
              },
            },
          });
          vocabSetId = vocabSet.id;
        }
      }

      const game = await tx.game.create({
        data: {
          educatorId: educator.id,
          title,
          type: gameType as any,
          vocabularySetId: vocabSetId,
          settings: gameSettings,
          isPublished: false,
        },
      });

      return { gameId: game.id, title: game.title };
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
