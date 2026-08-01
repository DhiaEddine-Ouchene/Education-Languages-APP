"use client";
import { useMemo, useState } from "react";
import GameShell from "./GameShell";
import { useGame } from "./useGame";
import type { FolderGame } from "./types";

type Rule = { op: string; a?: string; b?: string };
type Compiled = { label: string; check: (text: string) => boolean };

function compileRule(r: Rule): Compiled {
  const a = r.a || "";
  switch (r.op) {
    case "minWords": {
      const k = parseInt(a, 10) || 5;
      return { label: `At least ${k} words`, check: (t) => t.trim().split(/\s+/).filter(Boolean).length >= k };
    }
    case "minSentences": {
      const k = parseInt(a, 10) || 2;
      return { label: `At least ${k} sentences`, check: (t) => t.split(/[.!?]+/).filter((s) => s.trim()).length >= k };
    }
    case "includes": {
      const words = a.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const k = parseInt(r.b || "", 10) || 1;
      return { label: `Uses at least ${k} of: ${words.join(", ")}`, check: (t) => words.filter((w) => t.toLowerCase().includes(w)).length >= k };
    }
    case "startsWith":
      return { label: `Starts with “${a}”`, check: (t) => t.trim().toLowerCase().startsWith(a.toLowerCase()) };
    case "endsWith":
      return { label: `Ends with “${a}”`, check: (t) => t.trim().endsWith(a) };
    default:
      return { label: r.op, check: () => true };
  }
}

/** Faithful port of the folder's Writing engine (rubric checklist, teacher-review option). */
export default function Writing({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const d = game.data || {};
  const g = useGame(1, onComplete);
  const [text, setText] = useState(d.prefill || d.starter || "");

  const rubric = useMemo<Compiled[]>(() => {
    if (Array.isArray(d.rules)) return d.rules.map(compileRule);
    if (Array.isArray(d.rubric)) return d.rubric as Compiled[];
    return [];
  }, [d.rules, d.rubric]);

  const results = rubric.map((item) => ({ label: item.label, met: item.check(text) }));
  const unmet = results.filter((r) => !r.met);

  function submit() {
    if (g.feedback || !text.trim()) return;
    if (unmet.length === 0) g.submit(true, d.teacherReview ? "Rubric met — sent for teacher review. ✍️" : "All rubric points met! ✍️");
    else g.submit(false, "Still to do: " + unmet.map((u) => u.label).join(" · "));
  }

  return (
    <GameShell index={g.i} total={1} score={g.score} feedback={g.feedback} done={g.done} onNext={g.next}>
      <div className="card">
        <div className="tag">Your task</div>
        <p className="sentence">{d.prompt}</p>
        {d.wordBank && (
          <div className="word-bank">{d.wordBank.map((w: string) => <span key={w}>{w}</span>)}</div>
        )}
        {d.note && <p className="note">{d.note}</p>}
      </div>
      <textarea className="pad" value={text} onChange={(e) => setText(e.target.value)} placeholder="Start writing here…" disabled={!!g.feedback} />
      <ul className="rubric">
        {results.map((r) => (
          <li key={r.label} className={r.met ? "met" : ""}>{r.met ? "✅" : "◯"} {r.label}</li>
        ))}
      </ul>
      <div className="center-row">
        <button className="btn primary" onClick={submit} disabled={!!g.feedback}>Submit</button>
      </div>
    </GameShell>
  );
}
