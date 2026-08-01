"use client";
import { useState } from "react";
import GameShell from "./GameShell";
import AudioButton from "./AudioButton";
import { useGame } from "./useGame";
import type { FolderGame } from "./types";

function Blank({ value }: { value?: string }) {
  return <span className="blank">{value || "    "}</span>;
}

function LineWithBlank({ text, value }: { text: string; value?: string }) {
  if (!text.includes("___")) return <>{text}</>;
  const [a, b] = text.split("___");
  return (
    <>
      {a}
      <Blank value={value} />
      {b}
    </>
  );
}

/** Faithful port of the folder's FillBlank engine, including real dialogue bubbles. */
export default function FillBlank({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const rounds = game.data.rounds || [];
  const g = useGame(rounds.length, onComplete);
  const r = rounds[g.i] || {};
  const [value, setValue] = useState("");
  const [picked, setPicked] = useState<string | null>(null);

  function grade(val: string) {
    if (g.feedback || !val.trim()) return;
    const ok = val.trim().toLowerCase() === r.answer.toLowerCase();
    g.submit(ok, (ok ? "" : `Answer: “${r.answer}”. `) + (r.explain || ""));
  }
  function pick(opt: string) {
    setPicked(opt);
    grade(opt);
  }
  function next() {
    setValue("");
    setPicked(null);
    g.next();
  }

  const shown = picked ?? value;

  return (
    <GameShell index={g.i} total={rounds.length} score={g.score} feedback={g.feedback} done={g.done} onNext={next}>
      <div className="card">
        {r.task && <div className="tag">{r.task}</div>}
        {r.audioText && <AudioButton text={r.audioText} limit={r.maxReplays} />}
        {r.dialogue ? (
          <div className="dialogue">
            {r.dialogue.map((d: any, i: number) => (
              <div key={i} className={"bubble " + (d.s === "A" ? "left" : "right")}>
                <span className="speaker">{d.name || d.s}</span>
                <LineWithBlank text={d.line} value={shown} />
              </div>
            ))}
          </div>
        ) : (
          <p className="sentence">
            <LineWithBlank text={r.text} value={shown} />
          </p>
        )}
      </div>

      {g.feedback && r.rule && <div className="rule-card">📖 <span>{r.rule}</span></div>}

      {r.options && r.options.length ? (
        <div className="options">
          {r.options.map((opt: string) => {
            let cls = "option";
            if (g.feedback) {
              if (opt === r.answer) cls += " right";
              else if (opt === picked) cls += " wrong";
            }
            return (
              <button key={opt} className={cls} onClick={() => !g.feedback && pick(opt)}>
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="input-row">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your answer…"
            disabled={!!g.feedback}
            onKeyDown={(e) => e.key === "Enter" && grade(value)}
          />
          <button className="btn primary" onClick={() => grade(value)} disabled={!!g.feedback}>
            Check
          </button>
        </div>
      )}
    </GameShell>
  );
}
