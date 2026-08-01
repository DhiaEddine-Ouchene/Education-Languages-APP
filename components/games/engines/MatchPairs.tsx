"use client";
import { useMemo, useState } from "react";
import GameShell from "./GameShell";
import { useGame, shuffle } from "./useGame";
import type { FolderGame } from "./types";

/** Faithful port of the folder's MatchPairs engine. */
export default function MatchPairs({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const rounds = game.data.rounds || [];
  const g = useGame(rounds.length, onComplete);
  const r = rounds[g.i] || {};
  const pairs = r.pairs || [];
  const map = Object.fromEntries(pairs);
  const left = pairs.map((p: any) => p[0]);
  const right = useMemo(() => shuffle(pairs.map((p: any) => p[1])), [g.i]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selL, setSelL] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  function tapLeft(w: string) {
    if (g.feedback || matched.has(w)) return;
    setSelL(w);
  }
  function tapRight(def: string) {
    if (g.feedback || !selL || matched.has(def)) return;
    if (map[selL] === def) {
      const m = new Set(matched);
      m.add(selL);
      m.add(def);
      setMatched(m);
      setSelL(null);
      if (m.size === pairs.length * 2) {
        g.submit(mistakes === 0, mistakes === 0 ? "Perfect matching! 🎯" : `All matched, with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`);
      }
    } else {
      setMistakes((x) => x + 1);
      setFlash(def);
      setTimeout(() => setFlash(null), 400);
    }
  }
  function reset() {
    setSelL(null);
    setMatched(new Set());
    setMistakes(0);
    setFlash(null);
  }

  return (
    <GameShell index={g.i} total={rounds.length} score={g.score} feedback={g.feedback} done={g.done} onNext={() => { reset(); g.next(); }}>
      <div className="card center">
        <div className="tag">{game.data.task || "Match the pairs"}</div>
        <div className="pairs">
          <div className="pair-col">
            {left.map((w: string) => (
              <button key={w} className={"pair-item" + (matched.has(w) ? " done" : selL === w ? " sel" : "")} onClick={() => tapLeft(w)}>
                {w}
              </button>
            ))}
          </div>
          <div className="pair-col">
            {right.map((d: string) => (
              <button key={d} className={"pair-item" + (matched.has(d) ? " done" : flash === d ? " no" : "")} onClick={() => tapRight(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
