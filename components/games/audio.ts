"use client";

// Text-to-speech playback (language-agnostic: pass a lang code per content pack).
export function speak(text: string, opts: { lang?: string; rate?: number } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang || "en-US";
  u.rate = opts.rate || 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

type ListenOpts = {
  lang?: string;
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
};

// Speech recognition for speaking games. Returns the recognizer or null if unsupported.
export function listen({ lang = "en-US", onResult, onEnd, onError }: ListenOpts) {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    onError?.("unsupported");
    return null;
  }
  const r = new SR();
  r.lang = lang;
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.onresult = (e: any) => onResult?.(e.results[0][0].transcript);
  r.onend = () => onEnd?.();
  r.onerror = (e: any) => onError?.(e.error);
  r.start();
  return r;
}

export function speechSupported() {
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

// Fraction of target words present in what the student said (0..1).
export function similarity(target: string, said: string) {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z' ]/g, "").split(/\s+/).filter(Boolean);
  const t = norm(target);
  const s = new Set(norm(said || ""));
  if (!t.length) return 0;
  return t.filter((w) => s.has(w)).length / t.length;
}
