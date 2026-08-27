"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import GameShell from "./GameShell";
import { useGame, shuffle } from "./useGame";
import type { FolderGame } from "./types";

/**
 * Memory Match — a faithful re-theme of the MemoryBlocks reference game:
 *  • a REAL 3D card flip (perspective + rotateY, back-face hidden),
 *  • arcade scoring: 300 (first sighting) / 200 / 100, ×3 combo-streak bonus,
 *    −20 on a miss, with an animated points counter,
 *  • live stats (Score · Pairs · Moves · Time), a combo-streak indicator, and a
 *    bottom "Match History & Definitions" strip.
 *
 * Deliberately simple like the app's other games: one board, no ranking, levels,
 * leaderboard, high-score or achievements. Re-themed to the app's light-purple
 * `.fg` palette (styles live in folder.css under `.fg .mm-*`).
 *
 * Data shape (portable across the app):
 *   `{ pairs: [[word, match], …], defs?: { [word]: definition|example } }`
 * Pairs are inherently bilingual — pairs[i][0] is the target-language word and
 * pairs[i][1] its native-language translation — so the board honors both
 * languages a teacher sets up.
 *
 * Every side effect (timer, points tween, flashes) is CLICK-GATED so the engine
 * mounts inertly inside GamePoster thumbnails on example data.
 */
type Card = { id: number; text: string; role: 0 | 1 };
type HistItem = { word: string; mate: string; def: string; kind: "good" | "triple" };

const MATCH_MS = 420; // hold a matched pair face-up before locking it in
const MISS_MS = 820; // hold a wrong pair face-up before flipping back

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export default function MemoryMatch({
  game,
  onComplete,
}: {
  game: FolderGame;
  onComplete: (c: number, t: number) => void;
}) {
  const pairs: [string, string][] = game.data?.pairs || [];
  const defs: Record<string, string> = game.data?.defs || {};
  const g = useGame(1, onComplete);

  const [seed, setSeed] = useState(0);
  // Two cards per pair (role 0 = the word, role 1 = its match), then shuffled.
  const cards = useMemo<Card[]>(
    () =>
      shuffle(
        pairs.flatMap((p, id) =>
          [p[0], p[1]].map((text, role) => ({ id, text, role: role as 0 | 1 }))
        )
      ),
    [seed] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const totalPairs = pairs.length;

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [missPair, setMissPair] = useState<number[] | null>(null);
  const [justMatched, setJustMatched] = useState<number[] | null>(null);
  const [moves, setMoves] = useState(0);
  const [secs, setSecs] = useState(0);
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<HistItem[]>([]);

  // Score is tracked with a target (`points`) and an animated readout (`shown`).
  const [points, setPoints] = useState(0);
  const [shown, setShown] = useState(0);
  const [streakView, setStreakView] = useState(0); // current run length, for the combo card
  const [flash, setFlash] = useState<{ id: number; text: string; kind: string } | null>(null);

  // Logic-only refs (never rendered) so scoring reads fresh values inside timeouts.
  const streak = useRef(0);
  const seenById = useRef<Record<number, number>>({});
  const flashId = useRef(0);
  // Mirrors `points` so a miss can know how much it can actually take away.
  const pointsRef = useRef(0);

  const allMatched = cards.length > 0 && matched.size === cards.length;

  function showFlash(text: string, kind: string) {
    const id = ++flashId.current;
    setFlash({ id, text, kind });
    window.setTimeout(() => setFlash((f) => (f && f.id === id ? null : f)), 950);
  }

  /** Applies a score delta, floored at 0, and returns how much really moved. */
  function applyPoints(delta: number) {
    const next = Math.max(0, pointsRef.current + delta);
    const applied = next - pointsRef.current;
    pointsRef.current = next;
    setPoints(next);
    return applied;
  }

  // Count-up timer — starts only after the first flip (click-gated) and stops
  // when the board is cleared or the round is done.
  useEffect(() => {
    if (!started || g.done || allMatched) return;
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [started, g.done, allMatched]);

  // Animate the points readout toward the real total. Runs only while the two
  // differ, so it never spins up on an inert (example-data) mount.
  useEffect(() => {
    if (shown === points) return;
    const t = window.setInterval(() => {
      setShown((d) => {
        if (d === points) return d;
        const step = Math.max(1, Math.ceil(Math.abs(points - d) / 8));
        return d < points ? Math.min(d + step, points) : Math.max(d - step, points);
      });
    }, 26);
    return () => window.clearInterval(t);
  }, [shown, points]);

  // Report completion once every card is matched.
  useEffect(() => {
    if (allMatched && !g.feedback && !g.done) {
      g.submit(true, `Cleared ${totalPairs} pairs in ${moves} moves · ${fmtTime(secs)} · ${points} pts 🧠`);
    }
  }, [matched]); // eslint-disable-line react-hooks/exhaustive-deps

  function flip(i: number) {
    if (g.feedback || g.done) return;
    if (flipped.length >= 2 || flipped.includes(i) || matched.has(i)) return;
    if (!started) setStarted(true);

    const nf = [...flipped, i];
    setFlipped(nf);
    if (nf.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = nf;
    const idA = cards[a].id;

    if (idA === cards[b].id) {
      // Award before mutating: fewer prior sightings of this pair ⇒ bigger reward
      // (mirrors the reference's 300 / 200 / 100 by flip count).
      const seen = seenById.current[idA] || 0;
      const base = seen === 0 ? 300 : seen === 1 ? 200 : 100;
      window.setTimeout(() => {
        streak.current += 1;
        const triple = streak.current >= 3;
        const gained = triple ? base * 3 : base;
        setStreakView(triple ? 3 : streak.current);
        if (triple) streak.current = 0;
        applyPoints(gained);
        showFlash(triple ? `🔥 STREAK ×3  +${gained}` : `+${gained}`, triple ? "triple" : "good");

        setMatched((prev) => new Set(Array.from(prev).concat(a, b)));
        setJustMatched([a, b]);
        window.setTimeout(() => setJustMatched((j) => (j && j[0] === a ? null : j)), 700);
        setFlipped([]);

        const word = pairs[idA][0];
        const mate = pairs[idA][1] ?? "";
        setHistory((h) => [{ word, mate, def: defs[word] || "", kind: triple ? "triple" : "good" }, ...h]);
        if (triple) window.setTimeout(() => setStreakView(0), 900);
      }, MATCH_MS);
    } else {
      setMissPair([a, b]);
      streak.current = 0;
      setStreakView(0);
      seenById.current[idA] = (seenById.current[idA] || 0) + 1;
      seenById.current[cards[b].id] = (seenById.current[cards[b].id] || 0) + 1;
      window.setTimeout(() => {
        // Never claim a deduction the score can't absorb: at 0 points a miss is
        // just a miss, and at 10 points it costs 10 — not a phantom −20.
        const lost = applyPoints(-20);
        showFlash(lost < 0 ? `−${-lost}` : "Miss", "bad");
        setFlipped([]);
        setMissPair(null);
      }, MISS_MS);
    }
  }

  function reset() {
    setFlipped([]);
    setMatched(new Set());
    setMissPair(null);
    setJustMatched(null);
    setMoves(0);
    setSecs(0);
    setStarted(false);
    setHistory([]);
    setPoints(0);
    setShown(0);
    setStreakView(0);
    setFlash(null);
    streak.current = 0;
    seenById.current = {};
    pointsRef.current = 0;
    setSeed((s) => s + 1);
    g.restart();
  }

  const matchedPairs = matched.size / 2;
  const pairsLeft = totalPairs - matchedPairs;
  const pct = totalPairs ? Math.round((matchedPairs / totalPairs) * 100) : 0;
  // Balanced board: 3 cols for tiny sets, 4 for typical, 5 for large.
  const cols = cards.length <= 6 ? 3 : cards.length <= 16 ? 4 : 5;

  if (totalPairs === 0) {
    return (
      <GameShell index={g.i} total={1} score={g.score} feedback={g.feedback} done={g.done} onNext={g.next}>
        <p className="center" style={{ color: "var(--muted)", padding: "24px 0" }}>
          No pairs to match yet — add items to this game to play.
        </p>
      </GameShell>
    );
  }

  return (
    <GameShell index={g.i} total={1} score={g.score} feedback={g.feedback} done={g.done} onNext={g.next}>
      <div className="mm">
        {/* ── Stats row ── */}
        <div className="mm-stats">
          <div className="mm-stat is-score">
            <span className="mm-k">Score</span>
            <span className="mm-v">{shown.toLocaleString()}</span>
            {flash && (
              <span key={flash.id} className={"mm-flash " + flash.kind}>
                {flash.text}
              </span>
            )}
          </div>
          <div className="mm-stat">
            <span className="mm-k">Pairs</span>
            <span className="mm-v">{matchedPairs}<i className="mm-sub">/{totalPairs}</i></span>
          </div>
          <div className="mm-stat">
            <span className="mm-k">Moves</span>
            <span className="mm-v">{moves}</span>
          </div>
          <div className="mm-stat">
            <span className="mm-k">Time</span>
            <span className="mm-v">{fmtTime(secs)}</span>
          </div>
        </div>

        {/* ── Progress + combo streak ── */}
        <div className="mm-bar-row">
          <div className="mm-progress" aria-hidden>
            <div className="mm-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className={"mm-combo" + (streakView >= 2 ? " hot" : "") + (streakView >= 3 ? " max" : "")}>
            <span className="mm-combo-x">×{Math.min(Math.max(streakView, 1), 3)}</span>
            <span className="mm-combo-t">{streakView >= 3 ? "Triple bonus!" : streakView === 2 ? "One more for ×3" : "Combo streak"}</span>
          </div>
        </div>

        {/* ── Card grid (real 3D flip) ── */}
        <div className="mm-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {cards.map((c, i) => {
            const isMatched = matched.has(i);
            const open = flipped.includes(i) || isMatched;
            const cls =
              "mm-card" +
              (open ? " open" : "") +
              (isMatched ? " matched" : "") +
              (justMatched?.includes(i) ? " pop" : "") +
              (missPair?.includes(i) ? " miss" : "");
            return (
              <button
                key={i}
                className={cls}
                onClick={() => flip(i)}
                disabled={isMatched}
                aria-label={open ? c.text : "Hidden card"}
              >
                <span className="mm-inner">
                  <span className="mm-face mm-front" aria-hidden>
                    <span className="mm-badge" />
                  </span>
                  <span className="mm-face mm-back">{c.text}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Match History & Definitions ── */}
        <div className="mm-hist">
          <div className="mm-hist-head">Match History &amp; Definitions</div>
          <div className="mm-hist-strip">
            {history.length === 0 ? (
              <div className="mm-hist-empty">Flip two cards to find a matching pair…</div>
            ) : (
              history.map((h, k) => (
                <div key={k} className={"mm-hist-card" + (h.kind === "triple" ? " triple" : "")}>
                  <div className="mm-hist-words">
                    <span>{h.word}</span>
                    <i>↔</i>
                    <span>{h.mate}</span>
                  </div>
                  {h.def && <p className="mm-hist-def">{h.def}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {started && !allMatched && (
          <div className="mm-actions">
            <button className="mm-restart" onClick={reset}>↺ Restart</button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
