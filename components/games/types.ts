export type GameItem = {
  id: string;
  word: string;
  translation: string;
  audioUrl: string | null;
  imageUrl: string | null;
  exampleSentence: string | null;
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
