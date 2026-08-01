"use client";
import { useState } from "react";

export type Feedback = { correct: boolean; explain?: string };

/**
 * Faithful port of the folder's useGame state machine. `next()` advances a round;
 * on the final round it fires `onComplete(score, total)` so the app's result screen shows.
 */
export function useGame(total: number, onComplete?: (correct: number, total: number) => void) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [done, setDone] = useState(false);

  function submit(correct: boolean, explain?: string) {
    if (feedback) return;
    if (correct) setScore((s) => s + 1);
    setFeedback({ correct, explain });
  }
  function next() {
    setFeedback(null);
    if (i + 1 >= total) {
      setDone(true);
      onComplete?.(score, total);
    } else {
      setI(i + 1);
    }
  }
  function restart() {
    setI(0);
    setScore(0);
    setFeedback(null);
    setDone(false);
  }

  return { i, score, feedback, done, submit, next, restart };
}

export function shuffle<T = any>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
