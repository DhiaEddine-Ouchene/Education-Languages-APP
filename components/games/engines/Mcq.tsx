"use client";
import { useMemo, useState } from "react";
import GameShell from "./GameShell";
import AudioButton from "./AudioButton";
import { useGame, shuffle } from "./useGame";
import type { FolderGame } from "./types";

/** Faithful port of the folder's Mcq engine. */
export default function Mcq({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const rounds = game.data.rounds || [];
  const g = useGame(rounds.length, onComplete);
  const r = rounds[g.i] || {};
  const [picked, setPicked] = useState<string | null>(null);
  const options = useMemo(() => shuffle(r.options || []), [g.i]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(opt: string) {
    if (g.feedback) return;
    setPicked(opt);
    g.submit(opt === r.answer, r.explain);
  }
  function next() {
    setPicked(null);
    g.next();
  }

  return (
    <GameShell index={g.i} total={rounds.length} score={g.score} feedback={g.feedback} done={g.done} onNext={next}>
      <div className="card center">
        {r.sub && <div className="tag">{r.sub}</div>}
        {r.audioText && <AudioButton text={r.audioText} limit={r.maxReplays} />}
        {r.image && <div className="big-image">{r.image}</div>}
        {r.prompt && <div className="big-word">{r.prompt}</div>}
      </div>
      <div className={"options" + (r.stack ? " stack" : "")}>
        {options.map((opt: string) => {
          let cls = "option";
          if (g.feedback) {
            if (opt === r.answer) cls += " right";
            else if (opt === picked) cls += " wrong";
          }
          return (
            <button key={opt} className={cls} onClick={() => pick(opt)}>
              {opt}
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
