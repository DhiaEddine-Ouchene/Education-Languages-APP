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

// ----------------------------------------------------
// Lesson-based Exercise Generation
// ----------------------------------------------------

import { z } from "zod";

export const vocabularyItemSchema = z.object({
  word: z.string(),
  translation: z.string(),
  exampleSentence: z.string(),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
});
export type VocabularyItem = z.infer<typeof vocabularyItemSchema>;

const vocabularySetSchema = z.object({
  items: z.array(vocabularyItemSchema).min(1),
});

export const grammarItemSchema = z.object({
  gameType: z.enum([
    "SENTENCE_BUILDER",
    "ERROR_SPOTTING",
    "FILL_BLANK_GRAMMAR",
    "VERB_CONJUGATION",
    "MULTIPLE_CHOICE_GRAMMAR",
  ]),
  prompt: z.string(),
  correctAnswer: z.string(),
  distractors: z.array(z.string()).default([]),
  rule: z.string(),
  conjugation: z
    .object({
      verb: z.string(),
      tense: z.string(),
      forms: z.record(z.string()),
    })
    .nullable()
    .default(null),
});
export type GrammarItem = z.infer<typeof grammarItemSchema>;

const grammarSetSchema = z.object({
  items: z.array(grammarItemSchema).min(1),
});

function targetItemCount(lessonContent: string, wordsPerItem: number, min: number, max: number): number {
  const wordCount = lessonContent.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(min, Math.min(max, Math.round(wordCount / wordsPerItem)));
}

async function callGroq<T>(prompt: string, schema: z.ZodTypeAny): Promise<T[]> {
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const responseText = chatCompletion.choices[0]?.message?.content;
  if (!responseText) throw new Error("Groq returned no content");

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("Groq response was not valid JSON");
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Groq response failed validation: ${validated.error.message}`);
  }

  return (validated.data as { items: T[] }).items;
}

export async function generateVocabularySet(params: {
  lessonContent: string;
  language: string;
  level: string;
}): Promise<VocabularyItem[]> {
  const targetCount = targetItemCount(params.lessonContent, 40, 6, 30);

  const prompt = `You are generating a vocabulary exercise set for a language-learning app.

Language being learned: ${params.language}
Learner level (CEFR): ${params.level}
Target number of vocabulary items: ${targetCount}

Lesson content:
"""
${params.lessonContent}
"""

Pick the ${targetCount} most useful vocabulary words or short phrases from this lesson for a learner at this level. For each one, return:
- word: the word/phrase in ${params.language}
- translation: a short translation or definition
- exampleSentence: one natural example sentence using the word, in ${params.language}
- synonyms: 0-3 synonyms in ${params.language} (empty array if none fit)
- antonyms: 0-3 antonyms in ${params.language} (empty array if none fit)

Respond with ONLY a raw JSON object of the shape {"items": [...]}. No markdown fences, no commentary.`;

  return callGroq<VocabularyItem>(prompt, vocabularySetSchema);
}

export async function generateGrammarSet(params: {
  lessonContent: string;
  language: string;
  level: string;
}): Promise<GrammarItem[]> {
  const targetCount = targetItemCount(params.lessonContent, 60, 4, 20);

  const prompt = `You are generating a grammar exercise set for a language-learning app.

Language being learned: ${params.language}
Learner level (CEFR): ${params.level}
Target number of exercise items: ${targetCount}

Lesson content:
"""
${params.lessonContent}
"""

Identify the ${targetCount} most useful grammar points actually present or implied in this lesson (e.g. a verb tense used, a sentence structure, a common error at this level) and build one exercise item per point. Vary the gameType across the set rather than repeating one. For each item return:
- gameType: one of SENTENCE_BUILDER, ERROR_SPOTTING, FILL_BLANK_GRAMMAR, VERB_CONJUGATION, MULTIPLE_CHOICE_GRAMMAR
- prompt: the sentence or instruction shown to the student. Use "___" for a blank in FILL_BLANK_GRAMMAR, show the flawed sentence in ERROR_SPOTTING, show scrambled/unordered words in SENTENCE_BUILDER, show the sentence with the question in MULTIPLE_CHOICE_GRAMMAR
- correctAnswer: the correct word, sentence, or corrected version
- distractors: 2-4 wrong options (only needed for MULTIPLE_CHOICE_GRAMMAR and ERROR_SPOTTING style hints; empty array otherwise)
- rule: a short, student-friendly explanation of the grammar rule behind this item, in plain language
- conjugation: only when gameType is VERB_CONJUGATION, an object {verb, tense, forms} where forms maps each pronoun/subject to its conjugated form in ${params.language}. Otherwise null.

Respond with ONLY a raw JSON object of the shape {"items": [...]}. No markdown fences, no commentary.`;

  return callGroq<GrammarItem>(prompt, grammarSetSchema);
}
