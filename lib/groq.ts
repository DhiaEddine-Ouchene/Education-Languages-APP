import Groq from "groq-sdk";

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

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are an expert language teacher and curriculum designer. 
Your task is to extract the core vocabulary and grammar points from the provided course document text, and generate a set of interactive games and exercises based on that content.

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

export async function generateCourseContentGroq(
  text: string,
  targetLanguage: string,
  level: string
): Promise<GameGenerationResult> {
  const prompt = `
Target Language: ${targetLanguage}
Student Level: ${level}

Please extract the content and generate the games based on the following document text:

--- DOCUMENT TEXT START ---
${text}
--- DOCUMENT TEXT END ---

Remember to follow the JSON structure exactly.
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", // Use Groq's current fast 70B model
      temperature: 0.3,
      response_format: { type: "json_object" }, // Enforce JSON mode
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from Groq.");
    }

    const parsed = JSON.parse(responseText);
    return parsed as GameGenerationResult;
  } catch (err: any) {
    console.error("Failed to parse Groq response:", err);
    throw new Error(err.message || "AI generated invalid response format.");
  }
}
