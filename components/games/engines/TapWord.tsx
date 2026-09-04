"use client";
import { useState } from "react";
import GameShell from "./GameShell";
import { useGame } from "./useGame";
import type { FolderGame } from "./types";

/** Faithful port of the folder's TapWord engine (error spotting). */
export default function TapWord({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const rounds = game.data.rounds || [];
  const g = useGame(rounds.length, onComplete);
  const r = rounds[g.i] || {};
  const [sel, setSel] = useState<number | null>(null);
  const [phase, setPhase] = useState<"find" | "fix">("find");

  const words: string[] = Array.isArray(r.words)
    ? r.words
    : typeof r.words === "string"
      ? (r.words as string).split(/\s+/).filter(Boolean)
      : [];

  function tapWord(idx: number) {
    if (g.feedback || phase === "fix") return;
    setSel(idx);
    if (idx === r.errorIndex) setPhase("fix");
    else g.submit(false, `The error is “${words[r.errorIndex] || words[0] || ""}”. ` + (r.explain || ""));
  }
  function pickFix(opt: string) {
    if (g.feedback) return;
    g.submit(opt === r.correction, r.explain);
  }
  function next() {
    setSel(null);
    setPhase("find");
    g.next();
  }

  if (rounds.length === 0 || words.length === 0) {
    return (
      <GameShell index={0} total={0} score={0} feedback={null} done={false} onNext={next}>
        <div className="card center">
          <p className="note">No error-spotting rounds have been added to this game yet.</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell index={g.i} total={rounds.length} score={g.score} feedback={g.feedback} done={g.done} onNext={next}>
      <div className="card center">
        <div className="tag">{phase === "find" ? "Tap the incorrect word" : "Choose the correction"}</div>
        <div className="tap-words">
          {words.map((w: string, idx: number) => {
            let cls = "tap-word";
            if (g.feedback && idx === r.errorIndex) cls += " err";
            else if (idx === sel) cls += " sel";
            return (
              <button key={idx} className={cls} onClick={() => tapWord(idx)}>
                {w}
              </button>
            );
          })}
        </div>
      </div>
      {phase === "fix" && (
        <div className="options">
          {(r.corrections || []).map((opt: string) => {
            let cls = "option";
            if (g.feedback && opt === r.correction) cls += " right";
            return (
              <button key={opt} className={cls} onClick={() => pickFix(opt)}>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </GameShell>
  );
}
