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
  const pairs = r.pairs || []; // [[left, right], ...]
  const left = pairs.map((p: any, pi: number) => ({ label: p[0], i: pi }));
  const right = useMemo(() => shuffle(pairs.map((p: any, pi: number) => ({ label: p[1], i: pi }))), [g.i]); // eslint-disable-line react-hooks/exhaustive-deps

  // Match by PAIR INDEX, not by string value, so duplicate right-side labels
  // (e.g. two words sharing a translation) can't lock the board forever.
  const [selL, setSelL] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);

  function tapLeft(i: number) {
    if (g.feedback || matched.has(i)) return;
    setSelL(i);
  }
  function tapRight(item: { label: string; i: number }) {
    if (g.feedback || selL === null || matched.has(item.i)) return;
    if (selL === item.i) {
      const m = new Set(matched);
      m.add(item.i);
      setMatched(m);
      setSelL(null);
      if (m.size === pairs.length) {
        g.submit(mistakes === 0, mistakes === 0 ? "Perfect matching! 🎯" : `All matched, with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`);
      }
    } else {
      setMistakes((x) => x + 1);
      setFlash(item.i);
      setTimeout(() => setFlash(null), 400);
    }
  }
  function reset() {
    setSelL(null);
    setMatched(new Set());
    setMistakes(0);
    setFlash(null);
  }

  if (rounds.length === 0 || pairs.length === 0) {
    return (
      <GameShell index={0} total={0} score={0} feedback={null} done={false} onNext={() => { reset(); g.next(); }}>
        <div className="card center">
          <p className="note">No matching pairs have been added to this game yet.</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell index={g.i} total={rounds.length} score={g.score} feedback={g.feedback} done={g.done} onNext={() => { reset(); g.next(); }}>
      <div className="card center">
        <div className="tag">{game.data.task || "Match the pairs"}</div>
        <div className="pairs">
          <div className="pair-col">
            {left.map((w: { label: string; i: number }) => (
              <button key={w.i} className={"pair-item" + (matched.has(w.i) ? " done" : selL === w.i ? " sel" : "")} onClick={() => tapLeft(w.i)}>
                {w.label}
              </button>
            ))}
          </div>
          <div className="pair-col">
            {right.map((d: { label: string; i: number }) => (
              <button key={d.i} className={"pair-item" + (matched.has(d.i) ? " done" : flash === d.i ? " no" : "")} onClick={() => tapRight(d)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
