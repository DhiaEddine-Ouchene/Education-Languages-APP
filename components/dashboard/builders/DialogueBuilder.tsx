"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuilderProps } from "./index";

type Line = { id: string; name: string; side: "other" | "you"; text: string };
type Round = { id: string; scenario: string; answer: string; options: string[]; lines: Line[] };

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const blankLine = (side: "other" | "you", name: string): Line => ({ id: uid(), name, side, text: side === "you" ? "" : "" });

function createRound(): Round {
  return {
    id: uid(),
    scenario: "",
    answer: "",
    options: ["", "", ""],
    lines: [
      { id: uid(), name: "", side: "other", text: "" },
      { id: uid(), name: "You", side: "you", text: "" },
    ],
  };
}

/** Builder for SITUATION_DIALOGUE_FILL: a real conversation with named speakers.
 *  Use ___ for the blank; options + answer fill it. "You" bubbles are the student's side. */
export function DialogueBuilder({ onChange, initial, onValidation }: BuilderProps) {
  const [rounds, setRounds] = useState<Round[]>(() => {
    const raw = (initial?.dialogueItems as any[]) || [];
    if (raw.length) {
      return raw.map((r: any) => ({
        id: uid(),
        scenario: r.scenario || "",
        answer: r.answer || "",
        options: (r.options && r.options.slice(0, 3)) || ["", "", ""],
        lines: (r.lines || []).map((l: any) => ({
          id: uid(),
          name: l.name || "",
          side: l.s === "B" || l.side === "you" ? "you" : "other",
          text: l.text || "",
        })),
      }));
    }
    return [createRound()];
  });

  useEffect(() => {
    const valid = rounds.length >= 1 && rounds.every((r) => r.lines.some((l) => l.text.includes("___")) && r.answer.trim());
    onValidation?.(valid);
    onChange({
      dialogueItems: rounds.map((r) => ({
        scenario: r.scenario,
        answer: r.answer,
        options: r.options.filter(Boolean),
        lines: r.lines.map((l) => ({ name: l.name || (l.side === "you" ? "You" : "Speaker"), s: l.side === "you" ? "B" : "A", text: l.text })),
      })),
    });
  }, [rounds, onValidation]);

  const updateRound = (id: string, patch: Partial<Round>) =>
    setRounds((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const updateLine = (rid: string, lid: string, patch: Partial<Line>) =>
    setRounds((prev) => prev.map((r) => (r.id === rid ? { ...r, lines: r.lines.map((l) => (l.id === lid ? { ...l, ...patch } : l)) } : r)));

  return (
    <div className="space-y-4">
      {rounds.map((round, ri) => (
        <div key={round.id} className="space-y-3 rounded-card border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-txt-secondary">Conversation {ri + 1}</span>
            {rounds.length > 1 && (
              <button type="button" onClick={() => setRounds((p) => p.filter((r) => r.id !== round.id))} className="text-xs text-error">
                <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>

          <Input
            value={round.scenario}
            onChange={(e) => updateRound(round.id, { scenario: e.target.value })}
            placeholder="Scenario, e.g. At the restaurant / Ordering a taxi"
          />

          <div className="rounded-card border border-dashed border-primary/30 bg-primary-light/30 p-3">
            {round.lines.map((line, li) => (
              <div key={line.id} className="mb-2 last:mb-0">
                <div className="mb-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateLine(round.id, line.id, { side: line.side === "you" ? "other" : "you" })}
                    className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${line.side === "you" ? "bg-accent text-white" : "bg-primary text-white"}`}
                    title="Click to toggle who says this"
                  >
                    {line.side === "you" ? "YOU" : "THEM"}
                  </button>
                  <Input
                    value={line.name}
                    onChange={(e) => updateLine(round.id, line.id, { name: e.target.value })}
                    placeholder={line.side === "you" ? "Your name" : "Who are you talking to? e.g. Waiter, Taxi driver"}
                    className="h-7 flex-1 text-xs"
                  />
                  <button type="button" onClick={() => updateRound(round.id, { lines: round.lines.filter((l) => l.id !== line.id) })} className="text-error">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  value={line.text}
                  onChange={(e) => updateLine(round.id, line.id, { text: e.target.value })}
                  placeholder={line.side === "you" ? "Your line… (use ___ for the blank)" : "Their line…"}
                  className="h-8 text-xs"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => updateRound(round.id, { lines: [...round.lines, blankLine("other", "")] })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add line
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input value={round.answer} onChange={(e) => updateRound(round.id, { answer: e.target.value })} placeholder="Correct word for the blank" className="h-8" />
          </div>
          <div className="space-y-1.5">
            {round.options.map((o, i) => (
              <Input
                key={i}
                value={o}
                onChange={(e) => updateRound(round.id, { options: round.options.map((x, xi) => (xi === i ? e.target.value : x)) })}
                placeholder={`Distractor option ${i + 1}`}
                className="h-8 text-xs"
              />
            ))}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => setRounds((p) => [...p, createRound()])}>
        <Plus className="mr-1 h-4 w-4" /> Add conversation
      </Button>
    </div>
  );
}
