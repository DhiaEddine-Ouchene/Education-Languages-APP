import type { FolderGame } from "@/components/games/engines/types";
import type { GameItem } from "@/components/games/types";

const TYPE_EMOJI: Record<string, string> = {
  FLASHCARD: "🃏", FILL_BLANK: "✏️", DRAG_DROP: "🧩", QUIZ: "❓", DICTATION: "🎧",
  MEMORY: "🃏", SPEED_ROUND: "⚡", STORY: "📖", SYNONYM_ANTONYM: "🔤", FILL_GAP_WORD: "📝",
  WORD_MEANING_MATCH: "🔍", SITUATION_DIALOGUE_FILL: "💬", WORD_IN_CONTEXT: "📄",
  WORD_SCRAMBLE: "🔀", ODD_ONE_OUT: "🎯", SENTENCE_BUILDER: "🏗️", ERROR_SPOTTING: "🔎",
  FILL_BLANK_GRAMMAR: "✍️", VERB_CONJUGATION: "🔄", MULTIPLE_CHOICE_GRAMMAR: "☑️",
  LISTEN_FILL_WORD: "🎧", LISTEN_FILL_SENTENCE: "🔊", SPEAK_FILL_WORD: "🎙️",
  SPEAK_FILL_SENTENCE: "🗣️", CROSSWORD: "🧩", COLLOCATION_BUILDER: "🤝", FLASHCARD_3D: "🃏",
  MINIMAL_PAIR: "🔊", PICTURE_TO_WORD: "🖼️", CATEGORY_SORT: "🗂️", TRANSFORMATION: "🔄",
  WRITING_RUBRIC: "✍️", SPEAKING: "🎙️",
};

export function folderEngineForType(type: string): string {
  const map: Record<string, string> = {
    SYNONYM_ANTONYM: "mcq",
    ODD_ONE_OUT: "mcq",
    PICTURE_TO_WORD: "mcq",
    COLLOCATION_BUILDER: "mcq",
    WORD_IN_CONTEXT: "mcq",
    MINIMAL_PAIR: "mcq",
    SPEED_ROUND: "mcq",
    QUIZ: "mcq",
    MULTIPLE_CHOICE_GRAMMAR: "mcq",
    FLASHCARD: "mcq",
    FLASHCARD_3D: "mcq",
    FILL_BLANK_GRAMMAR: "fillblank",
    SITUATION_DIALOGUE_FILL: "fillblank",
    VERB_CONJUGATION: "fillblank",
    FILL_GAP_WORD: "fillblank",
    LISTEN_FILL_WORD: "fillblank",
    SPEAK_FILL_WORD: "fillblank",
    DICTATION: "texttask",
    LISTEN_FILL_SENTENCE: "texttask",
    SPEAK_FILL_SENTENCE: "texttask",
    TRANSFORMATION: "texttask",
    ERROR_SPOTTING: "tapword",
    WORD_SCRAMBLE: "order",
    SENTENCE_BUILDER: "order",
    WORD_MEANING_MATCH: "match",
    DRAG_DROP: "match",
    CATEGORY_SORT: "sort",
    MEMORY: "memory",
    CROSSWORD: "crossword",
    STORY: "writing",
    FILL_BLANK: "writing",
    WRITING_RUBRIC: "writing",
    SPEAKING: "speaking",
  };
  return map[type] || "mcq";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const wordOrPrompt = (it: GameItem, key: string) => (it as any)[key];

function mcqData(items: GameItem[], s: Record<string, any>, type: string) {
  if (type === "ODD_ONE_OUT" && Array.isArray(s.oddOneOutItems) && s.oddOneOutItems.length) {
    return {
      rounds: s.oddOneOutItems.map((it: any) => ({
        sub: "Which word does NOT belong?",
        prompt: it.category || undefined,
        options: it.groupWords || [],
        answer: it.oddWord || "",
        explain: `“${it.oddWord}” is the odd one out.`,
        stack: true,
      })),
    };
  }
  if (Array.isArray(s.questions) && s.questions.length) {
    return {
      rounds: s.questions.map((q: any) => ({
        sub: "Choose the correct answer",
        prompt: q.prompt,
        options: q.options || [],
        answer: q.correctAnswer,
        explain: q.explanation || "",
        stack: true,
      })),
    };
  }
  if (type === "PICTURE_TO_WORD") {
    return {
      rounds: items.map((it) => {
        const others = shuffle(items.filter((x) => x.id !== it.id)).slice(0, 3).map((x) => x.word);
        return {
          sub: "What do you see?",
          image: it.imageUrl || undefined,
          prompt: it.imageUrl ? undefined : it.word,
          options: shuffle([it.word, ...others]),
          answer: it.word,
        };
      }),
    };
  }
  return {
    rounds: items.map((it) => {
      const others = shuffle(items.filter((x) => x.id !== it.id)).slice(0, 3).map((x) => x.translation || x.word);
      return {
        sub: `What does “${it.word}” mean?`,
        prompt: it.word,
        options: shuffle([it.translation || it.word, ...others]),
        answer: it.translation || it.word,
      };
    }),
  };
}

function fillblankData(items: GameItem[], s: Record<string, any>) {
  if (Array.isArray(s.dialogueItems) && s.dialogueItems.length) {
    return {
      rounds: s.dialogueItems.map((d: any) => ({
        task: d.scenario,
        dialogue: (d.lines || []).map((l: any) => ({ s: l.s, name: l.name, line: l.text })),
        options: d.options || [],
        answer: d.answer || "",
      })),
    };
  }
  if (Array.isArray(s.sentenceItems) && s.sentenceItems.length) {
    return {
      rounds: s.sentenceItems.map((si: any) => ({
        text: si.sentence,
        options: si.options || [],
        answer: si.correctAnswer,
      })),
    };
  }
  return {
    rounds: items.map((it) => {
      const sentence = it.exampleSentence && it.exampleSentence.toLowerCase().includes(it.word.toLowerCase())
        ? it.exampleSentence.replace(new RegExp(it.word, "i"), "___")
        : `${it.word} means ___`;
      const others = shuffle(items.filter((x) => x.id !== it.id)).slice(0, 3).map((x) => x.translation || x.word);
      return { text: sentence, options: shuffle([it.translation || it.word, ...others]), answer: it.translation || it.word };
    }),
  };
}

function texttaskData(items: GameItem[], _s: Record<string, any>) {
  return {
    rounds: items.map((it: any) => {
      const answers = Array.isArray(it.answers) && it.answers.length ? it.answers : [it.translation || it.sentence || it.word || ""];
      return {
        instruction: it.instruction || "Type the correct answer",
        prompt: it.taskPrompt || it.word || it.sentence || "",
        answers,
      };
    }),
  };
}

function tapwordData(items: GameItem[], _s: Record<string, any>) {
  return {
    rounds: items.map((it: any) => {
      const sentence = it.sentenceWithError || it.word || "";
      const words = String(sentence).split(/\s+/);
      const wrong = it.wrongPart || "";
      return {
        words,
        errorIndex: wrong ? words.findIndex((w: string) => w.toLowerCase() === wrong.toLowerCase()) : 0,
        corrections: it.options || (it.correction ? [it.correction] : []),
        correction: it.correction || wrong,
        explain: it.ruleExplanation || it.explanation || "",
      };
    }),
  };
}

function orderData(items: GameItem[], _s: Record<string, any>) {
  return {
    rounds: items.map((it: any) => ({
      hint: it.hint || "Put the words in order",
      answer: it.answer || it.word || it.correctSentence || "",
    })),
  };
}

function matchData(items: GameItem[], _s: Record<string, any>) {
  return {
    task: "Match each word to its meaning",
    rounds: [{ pairs: items.map((it) => [it.word, it.translation || it.word]) }],
  };
}

export function buildFolderGame(
  type: string,
  settings: Record<string, any>,
  items: GameItem[]
): FolderGame {
  const s = settings || {};
  const derived: Record<string, any> = {
    mcq: mcqData(items, s, type),
    fillblank: fillblankData(items, s),
    texttask: texttaskData(items, s),
    tapword: tapwordData(items, s),
    order: orderData(items, s),
    match: matchData(items, s),
    sort: s.sortItems && s.sortItems.length
      ? { rounds: [{ categories: s.sortCategories || [], items: s.sortItems.map((i: any) => ({ word: i.word, cat: i.category || i.cat })) }] }
      : undefined,
    memory: items.length ? { pairs: items.map((it) => [it.word, it.translation || it.word]) } : undefined,
    crossword: { entries: s.crosswordWords || [] },
    writing: s.writingData || { prompt: items[0]?.word || "", wordBank: [], rules: [] },
    speaking: s.speakingItems ? { rounds: s.speakingItems } : undefined,
  };

  // Prefer explicitly stored folder-style data (from builders)
  const data = s.data && (s.data.rounds || s.data.pairs || s.data.entries || s.data.prompt || s.data.rules)
    ? s.data
    : derived[folderEngineForType(type)] || { rounds: [] };

  return {
    id: type,
    cat: "",
    emoji: TYPE_EMOJI[type] || "🎮",
    title: "",
    engine: folderEngineForType(type),
    data,
  };
}

export { TYPE_EMOJI as FOLDER_EMOJI, wordOrPrompt };
