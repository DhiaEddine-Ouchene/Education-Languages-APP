"use client";
import type { ReactNode } from "react";
import type { Feedback } from "./useGame";

/**
 * Faithful port of the folder's GameShell: score pill, progress bar, round content,
 * a bottom feedback bar (ok/bad) with Next/Finish, and a result card. Completion is
 * reported upward through `onNext` → the engine's `next()` → the app's onComplete.
 */
export default function GameShell({
  index,
  total,
  score,
  feedback,
  done,
  onNext,
  children,
}: {
  index: number;
  total: number;
  score: number;
  feedback: Feedback | null;
  done: boolean;
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fg">
      <div className="card center" style={{ padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="tag" style={{ margin: 0 }}>{done ? "Done" : `Round ${index + 1} / ${total}`}</span>
        <span className="score-pill" style={{ marginLeft: "auto", background: "#fff", borderRadius: 999, padding: "4px 10px", fontWeight: 800, boxShadow: "0 6px 24px rgba(45,42,74,.08)" }}>⭐ {score}</span>
      </div>

      {!done && total > 1 && (
        <div className="progress">
          <div className="progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      )}

      {done ? (
        <div className="result card">
          <div className="result-emoji">{score / Math.max(total, 1) >= 0.7 ? "🎉" : "💪"}</div>
          <h3>{score / Math.max(total, 1) >= 0.7 ? "Great job!" : "Keep practising!"}</h3>
          <p>You scored <strong>{score}</strong> out of <strong>{total}</strong>.</p>
          <div className="result-actions">
            <button className="btn primary" onClick={onNext}>Finish</button>
          </div>
        </div>
      ) : (
        <>
          {children}
          {feedback && (
            <div className={"feedback " + (feedback.correct ? "ok" : "bad")}>
              <div>
                <strong>{feedback.correct ? "Nice! ✓" : "Not quite ✗"}</strong>
                {feedback.explain && <p>{feedback.explain}</p>}
              </div>
              <button className="btn light" onClick={onNext}>
                {index + 1 >= total ? "Finish" : "Next"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
