export type GameItem = {
  id: string;
  word: string;
  translation: string;
  audioUrl: string | null;
  imageUrl: string | null;
  exampleSentence: string | null;

  // ODD_ONE_OUT
  words?: string[];
  oddWord?: string;
  category?: string;

  // SYNONYM_ANTONYM
  synonym?: string;
  antonym?: string;
  distractors?: string[];

  // PICTURE_TO_WORD / SPEED_ROUND
  imageSearchTerm?: string;
  imageTerm?: string;

  // COLLOCATION_BUILDER
  baseWord?: string;
  correctPartners?: string[];
  wrongPartners?: string[];

  // MINIMAL_PAIR
  wordA?: string;
  wordB?: string;

  // SITUATION_DIALOGUE_FILL
  scenario?: string;
  lines?: { speaker: string; text: string; isBlank: boolean }[];
  blanks?: { lineIndex: number; correctAnswer: string; distractors: string[] }[];

  // WORD_IN_CONTEXT
  correctSentence?: string;
  incorrectSentences?: string[];

  // SENTENCE_BUILDER
  // ERROR_SPOTTING
  sentenceWithError?: string;
  wrongPart?: string;
  correction?: string;
  ruleExplanation?: string;

  // FILL_BLANK_GRAMMAR
  sentenceWithBlank?: string;
  baseVerbForm?: string;
  correctConjugatedForm?: string;

  // VERB_CONJUGATION
  verb?: string;
  tense?: string;
  forms?: { pronoun: string; form: string }[];

  // MULTIPLE_CHOICE / QUIZ
  question?: string;
  options?: string[];
  correctOption?: string;
  explanation?: string;

  // DRAG_DROP
  dragItems?: string[];
  dragCategories?: string[];
  correctMapping?: Record<string, string>;

  // STORY
  writingPrompt?: string;
  wordBank?: string[];

  // FILL_BLANK / FILL_GAP_WORD
  correctWord?: string;

  // DICTATION / LISTEN_FILL_SENTENCE
  sentence?: string;

  // CROSSWORD
  clue?: string;

  // WORD_SCRAMBLE
  hint?: string;
};

export type GameSettings = {
  difficulty?: string;
  timer?: number;
  hints?: boolean;
  audioAutoplay?: boolean;
  shuffle?: boolean;
};

export type GameProps = {
  items: GameItem[];
  settings: GameSettings;
  onComplete: (correct: number, total: number) => void;
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function speak(text: string, rate = 1) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

export function playAudio(item: GameItem, rate = 1) {
  if (item.audioUrl) {
    const a = new Audio(item.audioUrl);
    a.playbackRate = rate;
    void a.play();
  } else {
    speak(item.word, rate);
  }
}
