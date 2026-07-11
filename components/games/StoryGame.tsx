"use client";
import { useMemo, useState } from "react";
import { type GameProps, shuffle } from "./types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const normalize = (s: string) => s.trim().toLowerCase();

export function StoryGame({ items, onComplete }: GameProps) {
  const storyItems = useMemo(() => shuffle(items).slice(0, 5), [items]);
  const [values, setValues] = useState<string[]>(Array(storyItems.length).fill(""));
  const [submitted, setSubmitted] = useState(false);

  const sentences = storyItems.map((i) =>
    i.exampleSentence?.toLowerCase().includes(i.word.toLowerCase())
      ? i.exampleSentence.replace(new RegExp(i.word, "i"), "@@")
      : `The word for “${i.translation}” is @@.`
  );

  const submit = () => {
    setSubmitted(true);
    const correct = storyItems.filter((i, n) => normalize(values[n]) === normalize(i.word)).length;
    setTimeout(() => onComplete(correct, storyItems.length), 1800);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <p className="text-sm text-txt-secondary text-center">Fill in all the blanks, then submit the full story. Word bank: {shuffle(storyItems).map((i) => i.word).join(", ")}</p>
      <div className="bg-card border border-border rounded-card p-5 leading-8 text-sm">
        {sentences.map((s, n) => {
          const [before, after] = s.split("@@");
          const ok = submitted && normalize(values[n]) === normalize(storyItems[n].word);
          return (
            <span key={n}>
              {before}
              <input
                value={values[n]}
                disabled={submitted}
                onChange={(e) => setValues((v) => v.map((x, j) => (j === n ? e.target.value : x)))}
                className={cn(
                  "inline-block w-28 mx-1 border-b-2 bg-transparent text-center font-medium focus:outline-none",
                  submitted ? (ok ? "border-accent text-accent" : "border-error text-error") : "border-primary"
                )}
              />
              {submitted && !ok && <span className="text-xs text-accent">({storyItems[n].word})</span>}
              {after}{" "}
            </span>
          );
        })}
      </div>
      <Button className="w-full" onClick={submit} disabled={submitted || values.some((v) => !v.trim())}>Submit story</Button>
    </div>
  );
}
