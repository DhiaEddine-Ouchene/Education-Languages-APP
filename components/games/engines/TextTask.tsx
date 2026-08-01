"use client";
import { useState } from "react";
import GameShell from "./GameShell";
import AudioButton from "./AudioButton";
import { useGame } from "./useGame";
import type { FolderGame } from "./types";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Faithful port of the folder's TextTask engine (dictation / transformation). */
export default function TextTask({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const rounds = game.data.rounds || [];
  const g = useGame(rounds.length, onComplete);
  const r = rounds[g.i] || {};
  const [value, setValue] = useState("");

  function check() {
    if (g.feedback || !value.trim()) return;
    const ok = (r.answers || []).some((a: string) => normalize(a) === normalize(value));
    g.submit(ok, (ok ? "" : `Expected: “${r.answers?.[0] || ""}”. `) + (r.explain || ""));
  }
  function next() {
    setValue("");
    g.next();
  }

  return (
    <GameShell index={g.i} total={rounds.length} score={g.score} feedback={g.feedback} done={g.done} onNext={next}>
      <div className="card center">
        {r.instruction && <div className="tag">{r.instruction}</div>}
        {r.audioText && <AudioButton text={r.audioText} limit={r.maxReplays} />}
        {r.prompt && <p className="sentence">{r.prompt}</p>}
      </div>
      <div className="input-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your sentence…"
          disabled={!!g.feedback}
          onKeyDown={(e) => e.key === "Enter" && check()}
        />
        <button className="btn primary" onClick={check} disabled={!!g.feedback}>
          Check
        </button>
      </div>
    </GameShell>
  );
}
