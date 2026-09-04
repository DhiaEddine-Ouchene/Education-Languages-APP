"use client";
import { useMemo, useState } from "react";
import GameShell from "./GameShell";
import { useGame } from "./useGame";
import type { FolderGame } from "./types";

/** Faithful port of the folder's Crossword engine. */
export default function Crossword({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const { entries = [] } = game.data || {};
  const g = useGame(1, onComplete);

  const model = useMemo(() => {
    const solution: Record<string, string> = {};
    let rows = 0,
      cols = 0;
    const starts: Record<string, number> = {};
    let n = 0;
    const numbered = [...entries]
      .filter((e: any) => e && (e.word || "").length > 0)
      .sort((a: any, b: any) => (a.row || 0) - (b.row || 0) || (a.col || 0) - (b.col || 0))
      .map((e: any) => {
        const row = e.row || 0;
        const col = e.col || 0;
        const k = row + "," + col;
        if (!(k in starts)) {
          n++;
          starts[k] = n;
        }
        const wordStr = String(e.word || "").toUpperCase();
        for (let i = 0; i < wordStr.length; i++) {
          const r = e.dir === "down" ? row + i : row;
          const c = e.dir === "down" ? col : col + i;
          solution[r + "," + c] = wordStr[i];
          rows = Math.max(rows, r + 1);
          cols = Math.max(cols, c + 1);
        }
        return { ...e, word: wordStr, row, col, num: starts[k] };
      });
    return { solution, rows, cols, numbered, starts };
  }, [entries]);

  const [vals, setVals] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<Set<string>>(new Set());

  function setCell(k: string, v: string) {
    setWrong(new Set());
    setVals({ ...vals, [k]: v.slice(-1).toUpperCase() });
  }
  function check() {
    if (g.feedback) return;
    const bad: string[] = [];
    let filled = true;
    for (const [k, ch] of Object.entries(model.solution)) {
      const v = (vals[k] || "").toUpperCase();
      if (!v) filled = false;
      else if (v !== ch) bad.push(k);
    }
    setWrong(new Set(bad));
    if (bad.length === 0 && filled) {
      g.submit(true, "Crossword complete! 🧩");
    } else if (bad.length > 0) {
      g.submit(false, `${bad.length} wrong. Fix them, or press Finish to move on.`);
    } else {
      g.submit(false, "Some cells are empty. Fill every cell, or press Finish to move on.");
    }
  }
  function reset() {
    setVals({});
    setWrong(new Set());
  }

  if (entries.length === 0 || model.rows === 0) {
    return (
      <GameShell index={0} total={0} score={0} feedback={null} done={false} onNext={reset}>
        <div className="card center">
          <p className="note">No crossword puzzle entries added yet.</p>
        </div>
      </GameShell>
    );
  }

  const cells = [];
  for (let r = 0; r < model.rows; r++) {
    for (let c = 0; c < model.cols; c++) {
      const k = r + "," + c;
      if (k in model.solution) {
        cells.push(
          <div key={k} className={"cw-cell" + (wrong.has(k) ? " wrong" : "")}>
            {model.starts[k] && <span className="cw-num">{model.starts[k]}</span>}
            <input value={vals[k] || ""} onChange={(e) => setCell(k, e.target.value)} maxLength={2} disabled={!!g.feedback} />
          </div>
        );
      } else {
        cells.push(<div key={k} className="cw-void" />);
      }
    }
  }

  return (
    <GameShell index={g.i} total={1} score={g.score} feedback={g.feedback} done={g.done} onNext={g.next}>
      <div className="card">
        <div className="cw-grid" style={{ gridTemplateColumns: `repeat(${model.cols}, 2.1rem)` }}>
          {cells}
        </div>
        <div className="clues">
          <h4>Across</h4>
          <ol>{model.numbered.filter((e: any) => e.dir === "across").map((e: any) => <li key={e.word} value={e.num}>{e.clue}</li>)}</ol>
          <h4>Down</h4>
          <ol>{model.numbered.filter((e: any) => e.dir === "down").map((e: any) => <li key={e.word} value={e.num}>{e.clue}</li>)}</ol>
        </div>
        <div className="center-row">
          <button className="btn primary" onClick={check} disabled={!!g.feedback}>Check answers</button>
        </div>
      </div>
    </GameShell>
  );
}
