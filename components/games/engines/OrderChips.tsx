"use client";
import { useMemo, useState } from "react";
import GameShell from "./GameShell";
import AudioButton from "./AudioButton";
import { useGame, shuffle } from "./useGame";
import type { FolderGame } from "./types";

/** Faithful port of the folder's OrderChips engine (build sentence / word scramble). */
export default function OrderChips({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const rounds = game.data.rounds || [];
  const g = useGame(rounds.length, onComplete);
  const r = rounds[g.i] || {};
  const letters = game.data.mode === "letters";
  const source = r.fragments || (letters ? r.answer.toUpperCase().split("") : r.answer.split(" "));
  const target = r.fragments ? r.fragments.join(" ") : letters ? r.answer.toUpperCase() : r.answer;

  const chips = useMemo(() => {
    let s = shuffle(source.map((t: string, k: number) => ({ t, k })));
    if (s.map((c: any) => c.t).join(letters ? "" : " ") === target) s = [...s.slice(1), s[0]];
    return s;
  }, [g.i]); // eslint-disable-line react-hooks/exhaustive-deps

  const [placed, setPlaced] = useState<number[]>([]);
  const byKey = Object.fromEntries(chips.map((c: any) => [c.k, c.t]));
  const joined = placed.map((k) => byKey[k]).join(letters ? "" : " ");

  function check() {
    if (g.feedback || placed.length !== chips.length) return;
    g.submit(joined === target, joined === target ? r.explain : `Answer: “${target}”. ` + (r.explain || ""));
  }
  function next() {
    setPlaced([]);
    g.next();
  }

  return (
    <GameShell index={g.i} total={rounds.length} score={g.score} feedback={g.feedback} done={g.done} onNext={next}>
      <div className="card center">
        {r.hint && <div className="tag">{r.hint}</div>}
        {r.audioText && <AudioButton text={r.audioText} limit={r.maxReplays} />}
        <div className="chip-zone">
          {placed.map((k) => (
            <button key={k} className={"chip placed" + (letters ? " letter" : "")} onClick={() => !g.feedback && setPlaced(placed.filter((p) => p !== k))}>
              {byKey[k]}
            </button>
          ))}
        </div>
        <div className="chip-pool">
          {chips
            .filter((c: any) => !placed.includes(c.k))
            .map((c: any) => (
              <button key={c.k} className={"chip" + (letters ? " letter" : "")} onClick={() => !g.feedback && setPlaced([...placed, c.k])}>
                {c.t}
              </button>
            ))}
        </div>
        <button className="btn primary" onClick={check} disabled={placed.length !== chips.length || !!g.feedback}>
          Check
        </button>
      </div>
    </GameShell>
  );
}
