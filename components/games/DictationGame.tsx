"use client";
import { useEffect, useMemo, useState } from "react";
import { GameProgressBar } from "./GameProgressBar";
import { type GameProps, shuffle, playAudio } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";

const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,!?¡¿]/g, "");

export function DictationGame({ items, settings, onComplete }: GameProps) {
  const deck = useMemo(() => (settings.shuffle ? shuffle(items) : items), [items, settings.shuffle]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [value, setValue] = useState("");
  const [rate, setRate] = useState(1);
  const [result, setResult] = useState<"ok" | "bad" | null>(null);
  const item = deck[idx];

  useEffect(() => {
    const t = setTimeout(() => playAudio(item, rate), 400);
    return () => clearTimeout(t);
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = () => {
    const ok = normalize(value) === normalize(item.word);
    setResult(ok ? "ok" : "bad");
    if (ok) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (idx + 1 >= deck.length) return onComplete(correct, deck.length);
    setValue("");
    setResult(null);
    setIdx(idx + 1);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <GameProgressBar current={idx} total={deck.length} />
      <div className="flex flex-col items-center gap-3">
        <button onClick={() => playAudio(item, rate)} className="h-20 w-20 rounded-pill bg-primary text-white flex items-center justify-center" aria-label="Play audio">
          <Volume2 className="h-8 w-8" />
        </button>
        <div className="flex gap-2">
          {[0.75, 1, 1.25].map((r) => (
            <button key={r} onClick={() => setRate(r)} className={cn("text-xs rounded-pill px-3 py-1 border", rate === r ? "border-primary bg-primary-light text-primary-dark font-medium" : "border-border")}>{r}x</button>
          ))}
        </div>
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !result && check()}
        placeholder="Type what you hear..."
        disabled={!!result}
        className={cn(result === "ok" && "border-accent bg-accent-light", result === "bad" && "border-error bg-red-50 animate-shake")}
      />
      {result === "bad" && <p className="text-sm text-center">Correct: <b>{item.word}</b> ({item.translation})</p>}
      {result == null ? (
        <Button className="w-full" onClick={check} disabled={!value.trim()}>Submit</Button>
      ) : (
        <Button className="w-full" onClick={next}>{idx + 1 >= deck.length ? "Finish" : "Next"}</Button>
      )}
    </div>
  );
}
