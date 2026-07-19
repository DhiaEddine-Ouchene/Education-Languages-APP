import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

export interface GameGenerationResult {
  vocabularySet: {
    name: string;
    items: {
      word: string;
      translation: string;
      exampleSentence: string;
    }[];
  };
  games: {
    title: string;
    type: string;
    anex: "VOCABULARY" | "GRAMMAR" | "LISTENING_WRITING" | "SPEAKING";
    settings: any;
  }[];
}

const SYSTEM_PROMPT = `
You are an expert language teacher and curriculum designer. 
You will receive a course document (text, image, or PDF content).
Your task is to extract the core vocabulary and grammar points from this document, and generate a set of interactive games and exercises based on that content.

You MUST respond with valid JSON in the following exact structure:
{
  "vocabularySet": {
    "name": "A descriptive name for this vocabulary list",
    "items": [
      {
        "word": "The target word or phrase",
        "translation": "The translation or simple definition",
        "exampleSentence": "An example sentence using the word"
      }
    ]
  },
  "games": [
    {
      "title": "A catchy title for the game",
      "type": "ONE_OF_THE_ALLOWED_GAME_TYPES",
      "anex": "ONE_OF_THE_ALLOWED_ANEXES",
      "settings": {
        // Game-specific configuration, questions, answers, etc.
        // For example, for a quiz: { "questions": [{ "question": "...", "options": ["A", "B", "C"], "answer": "A" }] }
      }
    }
  ]
}

ALLOWED ANEXES:
- VOCABULARY
- GRAMMAR
- LISTENING_WRITING
- SPEAKING

ALLOWED GAME TYPES:
- SYNONYM_ANTONYM
- FILL_GAP_WORD
- WORD_MEANING_MATCH
- SITUATION_DIALOGUE_FILL
- WORD_IN_CONTEXT
- WORD_SCRAMBLE
- ODD_ONE_OUT
- SENTENCE_BUILDER
- ERROR_SPOTTING
- FILL_BLANK_GRAMMAR
- VERB_CONJUGATION
- MULTIPLE_CHOICE_GRAMMAR
- LISTEN_FILL_WORD
- LISTEN_FILL_SENTENCE
- SPEAK_FILL_WORD
- SPEAK_FILL_SENTENCE

Generate at least 4 different games covering different annexes (at least one for vocabulary, grammar, listening, and speaking) based on the provided material. Ensure the settings JSON is fully populated with the generated content for each game.
`;

export async function generateCourseContent(
  fileBuffer: Buffer,
  mimeType: string,
  targetLanguage: string,
  level: string
): Promise<GameGenerationResult> {
  const filePart = {
    inlineData: {
      data: fileBuffer.toString("base64"),
      mimeType,
    },
  };

  const prompt = `
Target Language: ${targetLanguage}
Student Level: ${level}

Please extract the content and generate the games based on the attached document.
Remember to follow the JSON structure exactly.
`;

  const result = await geminiModel.generateContent([
    { text: SYSTEM_PROMPT },
    filePart,
    { text: prompt },
  ]);

  const responseText = result.response.text();
  try {
    const parsed = JSON.parse(responseText);
    return parsed as GameGenerationResult;
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON:", responseText);
    throw new Error("AI generated invalid response format.");
  }
}
