"use client";
import { useState } from "react";
import { speak } from "../audio";

/** Faithful port of the folder's AudioButton: big round play/replay button. */
export default function AudioButton({ text, limit }: { text: string; limit?: number }) {
  const [left, setLeft] = useState<number | null>(limit ?? null);

  function play() {
    if (left !== null && left <= 0) return;
    speak(text);
    if (left !== null) setLeft((l) => (l as number) - 1);
  }

  return (
    <div className="audio-wrap">
      <button className="audio-btn" onClick={play} disabled={left !== null && left <= 0} aria-label="Play audio">
        🔊
      </button>
      {left !== null && (
        <span className="replays">{left} play{left === 1 ? "" : "s"} left</span>
      )}
    </div>
  );
}
