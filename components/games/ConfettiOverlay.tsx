"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiOverlay({ fire }: { fire: boolean }) {
  useEffect(() => {
    if (!fire) return;
    const burst = (x: number) => confetti({ particleCount: 80, spread: 70, origin: { x, y: 0.6 }, colors: ["#7F77DD", "#1D9E75", "#EF9F27"] });
    burst(0.3);
    const t = setTimeout(() => burst(0.7), 250);
    return () => clearTimeout(t);
  }, [fire]);
  return null;
}

export function burstConfetti() {
  confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 }, colors: ["#7F77DD", "#1D9E75", "#EF9F27"] });
}
