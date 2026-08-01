"use client";
import { useState } from "react";
import GameShell from "./GameShell";
import { useGame } from "./useGame";
import type { FolderGame } from "./types";

/** Faithful port of the folder's CategorySort engine. */
export default function CategorySort({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const rounds = game.data.rounds || [];
  const g = useGame(rounds.length, onComplete);
  const r = rounds[g.i] || {};
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [flash, setFlash] = useState<{ cat: string; ok: boolean } | null>(null);

  const items = r.items || [];
  const item = items[idx];

  function drop(cat: string) {
    if (g.feedback || flash) return;
    const ok = item.cat === cat;
    setFlash({ cat, ok });
    if (ok) setCorrect((c) => c + 1);
    setTimeout(() => {
      setFlash(null);
      if (idx + 1 >= items.length) {
        const total = correct + (ok ? 1 : 0);
        g.submit(total === items.length, `You sorted ${total}/${items.length} correctly.`);
      } else {
        setIdx(idx + 1);
      }
    }, 650);
  }
  function reset() {
    setIdx(0);
    setCorrect(0);
    setFlash(null);
  }

  return (
    <GameShell index={g.i} total={rounds.length} score={g.score} feedback={g.feedback} done={g.done} onNext={() => { reset(); g.next(); }}>
      <div className="card center">
        <div className="tag">Word {Math.min(idx + 1, items.length)} of {items.length}</div>
        <div className="big-word">{item?.word}</div>
      </div>
      <div className="buckets" style={{ gridTemplateColumns: `repeat(${(r.categories || []).length}, 1fr)` }}>
        {(r.categories || []).map((cat: string) => {
          let cls = "bucket";
          if (flash && flash.cat === cat) cls += flash.ok ? " ok" : " no";
          return (
            <button key={cat} className={cls} onClick={() => drop(cat)}>
              {cat}
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
