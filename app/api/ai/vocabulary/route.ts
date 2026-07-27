import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth, getEducatorProfile } from "@/lib/auth";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getEducatorProfile(session.user.id);
    if (!profile) return NextResponse.json({ error: "Profile required" }, { status: 403 });

    const { topic, language = "English", targetLanguage = "English", level = "B1", count = 10 } = await req.json();

    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const prompt = `Generate a list of exactly ${count} vocabulary words or short phrases about the topic "${topic}" suitable for ${level} level learners.
The words should be in ${language}.
Also provide their accurate translation in ${targetLanguage}.

For the antonym field, if a word does not have a clear or natural opposite (like many nouns or specific terms), leave the antonym string empty "".

Respond ONLY with a valid JSON object in this exact format:
{
  "items": [
    {
      "word": "word in ${language}",
      "translation": "translation in ${targetLanguage}",
      "synonym": "a synonym in ${targetLanguage}",
      "antonym": "an antonym in ${targetLanguage} (or empty string if none exists)",
      "exampleSentence": "an example sentence using the word in ${language}",
      "definition": "a simple definition in ${targetLanguage}"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful language learning assistant. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content || "{}";

    let jsonString = text.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const data = JSON.parse(jsonString);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid format returned from AI");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Gen Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate vocabulary" }, { status: 500 });
  }
}
