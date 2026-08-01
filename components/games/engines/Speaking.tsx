"use client";
import { useEffect, useRef, useState } from "react";
import GameShell from "./GameShell";
import AudioButton from "./AudioButton";
import { useGame } from "./useGame";
import { listen, similarity, speechSupported } from "../audio";
import type { FolderGame } from "./types";

/** Faithful port of the folder's Speaking engine (mic + speech recognition). */
export default function Speaking({ game, onComplete }: { game: FolderGame; onComplete: (c: number, t: number) => void }) {
  const rounds = game.data.rounds || [];
  const g = useGame(rounds.length, onComplete);
  const r = rounds[g.i] || {};
  const [rec, setRec] = useState(false);
  const [transcript, setTranscript] = useState("");
  const supported = speechSupported();
  const gradedRef = useRef(false);

  function start() {
    if (rec || g.feedback) return;
    setTranscript("");
    gradedRef.current = false;
    setRec(true);
    listen({
      onResult: (t) => setTranscript(t),
      onEnd: () => setRec(false),
      onError: () => setRec(false),
    });
  }

  useEffect(() => {
    if (rec || !transcript || g.feedback || gradedRef.current) return;
    gradedRef.current = true;
    if (r.mode === "describe") {
      g.submit(true, `Saved for teacher review 📝 You said: “${transcript}”`);
    } else if (r.keywords && r.keywords.length) {
      const said = transcript.toLowerCase();
      const hits = r.keywords.filter((k: string) => said.includes(k));
      g.submit(hits.length >= 1, `Key phrases used: ${hits.join(", ") || "none"}. You said: “${transcript}”`);
    } else {
      const s = similarity(r.target || "", transcript);
      g.submit(s >= 0.6, `Match score: ${Math.round(s * 100)}%. You said: “${transcript}”`);
    }
  }, [rec, transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    setTranscript("");
    g.next();
  }

  return (
    <GameShell index={g.i} total={rounds.length} score={g.score} feedback={g.feedback} done={g.done} onNext={next}>
      <div className="card center">
        {r.task && <div className="tag">{r.task}</div>}
        {r.audioText && <AudioButton text={r.audioText} />}
        {r.image && <div className="big-image">{r.image}</div>}
        {r.display && <p className="sentence">{r.display}</p>}
        {r.note && <p className="note">{r.note}</p>}
      </div>
      {supported ? (
        <>
          <button className={"rec-btn" + (rec ? " on" : "")} onClick={start} aria-label="Record">
            {rec ? "⏹" : "🎤"}
          </button>
          {transcript && <div className="transcript">🗣 {transcript}</div>}
        </>
      ) : (
        <div className="card center">
          <p className="note">Speech recognition is not supported in this browser. Try Chrome or Edge.</p>
          <button className="btn ghost" onClick={() => g.submit(true, "Skipped — speech recognition unavailable.")}>Skip round</button>
        </div>
      )}
    </GameShell>
  );
}
