"use client";
import { useEffect, useMemo, useState } from "react";
import GameShell from "./GameShell";
import { useGame, shuffle } from "./useGame";
import type { FolderGame } from "./types";

/** Faithful port of the folder's MemoryMatch engine (flip cards + definition popup). */
export default function MemoryMatch({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const { pairs = [], defs = {} } = game.data || {};
  const g = useGame(1, onComplete);
  const [seed, setSeed] = useState(0);
  const cards = useMemo(
    () => shuffle(pairs.flatMap((p: any, id: number) => p.map((text: string) => ({ id, text })))),
    [seed] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [secs, setSecs] = useState(0);
  const [started, setStarted] = useState(false);
  const [popup, setPopup] = useState<{ word: string; def: string } | null>(null);

  useEffect(() => {
    if (!started || matched.size === cards.length) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [started, matched, cards.length]);

  useEffect(() => {
    if (cards.length && matched.size === cards.length && !g.feedback && !g.done) {
      g.submit(true, `Completed in ${moves} moves and ${secs}s. 🧠`);
    }
  }, [matched]); // eslint-disable-line react-hooks/exhaustive-deps

  function flip(i: number) {
    if (g.feedback || flipped.length === 2 || flipped.includes(i) || matched.has(i)) return;
    setStarted(true);
    const nf = [...flipped, i];
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nf;
      if (cards[a].id === cards[b].id) {
        setTimeout(() => {
          setMatched((prev) => new Set(Array.from(prev).concat(a, b)));
          setFlipped([]);
          const word = pairs[cards[a].id][0];
          if (defs && defs[word]) setPopup({ word, def: defs[word] });
        }, 500);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  }
  function reset() {
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setSecs(0);
    setStarted(false);
    setPopup(null);
    setSeed((s) => s + 1);
  }

  return (
    <GameShell index={g.i} total={1} score={g.score} feedback={g.feedback} done={g.done} onNext={g.next}>
      <div className="mem-stats">
        <span>⏱ {secs}s</span>
        <span>👣 {moves} moves</span>
        <span>Round 1</span>
      </div>
      <div className="mem-grid">
        {cards.map((c: any, i: number) => {
          const open = flipped.includes(i) || matched.has(i);
          return (
            <button key={i} className={"mem-card" + (open ? " open" : "") + (matched.has(i) ? " matched" : "")} onClick={() => flip(i)}>
              <span className="mem-inner">
                <span className="mem-face mem-front">?</span>
                <span className="mem-face mem-back">{c.text}</span>
              </span>
            </button>
          );
        })}
      </div>
      {popup && (
        <div className="overlay" onClick={() => setPopup(null)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <h3>✨ {popup.word}</h3>
            <p>{popup.def}</p>
            <button className="btn primary" onClick={() => setPopup(null)}>Got it</button>
          </div>
        </div>
      )}
    </GameShell>
  );
}
