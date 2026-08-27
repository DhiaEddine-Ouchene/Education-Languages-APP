"use client";
import { useState } from "react";
import GameShell from "./GameShell";
import type { FolderGame } from "./types";

/**
 * Flashcard (flip-card) engine — matches the real concept: a card shows the word
 * on the front; tap to flip it over in 3-D and reveal the translation, a short
 * definition and an example; then self-rate "I knew it" / "Still learning" to
 * advance. There is no single "correct answer" (that was the old, wrong MCQ
 * behaviour) — the score is simply how many cards you already knew.
 *
 * data = { task?: string, cards: [{ front, back, hint?, example? }] }
 */
type Card = { front: string; back: string; hint?: string; example?: string };

export default function Flashcard({
  game,
  onComplete,
}: {
  game: FolderGame;
  onComplete: (c: number, t: number) => void;
}) {
  const cards: Card[] = (game.data.cards as Card[]) || [];
  const total = cards.length;
  const [i, setI] = useState(0);
  const [known, setKnown] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const card = cards[i] || ({} as Card);

  // Rating both records the self-assessment and advances. We compute the final
  // known-count locally (not from state) so the last card reports the right
  // score even before React flushes the setKnown update.
  function rate(isKnown: boolean) {
    const newKnown = known + (isKnown ? 1 : 0);
    setKnown(newKnown);
    if (i + 1 >= total) {
      setDone(true);
      onComplete(newKnown, total);
    } else {
      setI(i + 1);
      setFlipped(false);
    }
  }

  function restart() {
    setI(0);
    setKnown(0);
    setFlipped(false);
    setDone(false);
  }

  if (total === 0) {
    return (
      <GameShell index={0} total={0} score={0} feedback={null} done={false} onNext={restart}>
        <div className="card center">
          <p className="note">No flashcards have been added to this game yet.</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell index={i} total={total} score={known} feedback={null} done={done} onNext={restart}>
      <div
        className={"fc-card" + (flipped ? " flipped" : "")}
        onClick={() => { if (!flipped) setFlipped(true); }}
        role="button"
        aria-label={flipped ? "Flashcard back" : "Flashcard front — tap to flip"}
      >
        <div className="fc-inner">
          {/* FRONT — the word to study */}
          <div className="fc-face fc-front">
            <span className="fc-tag">{game.data.task || "Flashcard"}</span>
            <div className="fc-word">{card.front}</div>
            {card.hint && <div className="fc-hint">{card.hint}</div>}
            <div className="fc-flip-hint">tap to flip ↻</div>
          </div>
          {/* BACK — translation + definition + example */}
          <div className="fc-face fc-back">
            <div className="fc-back-word">{card.back}</div>
            {card.example && <div className="fc-example">“{card.example}”</div>}
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="fc-actions">
          <button className="btn ghost" onClick={() => rate(false)}>😕 Still learning</button>
          <button className="btn primary" onClick={() => rate(true)}>✅ I knew it</button>
        </div>
      ) : (
        <p className="fc-prompt">Recall the meaning, then tap the card to check.</p>
      )}
    </GameShell>
  );
}
