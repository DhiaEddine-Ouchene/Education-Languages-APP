"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuilderProps } from "./index";

type Item = { id: string; mode: string; task: string; display: string; target: string; keywords: string; note: string };

const MODES = [
  { value: "repeat", label: "Listen & repeat" },
  { value: "read", label: "Read aloud" },
  { value: "gap", label: "Speak the gap" },
  { value: "roleplay", label: "Roleplay (keywords)" },
  { value: "describe", label: "Describe (teacher review)" },
];

function createItem(overrides?: Partial<Item>): Item {
  return { id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, mode: "repeat", task: "", display: "", target: "", keywords: "", note: "", ...overrides };
}

/** Builder for SPEAKING: mic rounds with a mode, prompt and grading hint. */
export function SpeakingBuilder({ onChange, initial, onValidation }: BuilderProps) {
  const [items, setItems] = useState<Item[]>(
    ((initial?.speakingItems as Item[]) || []).map((i) => ({ ...i }))
  );

  useEffect(() => {
    const valid = items.length >= 1 && items.every((i) => (i.display.trim() || i.target.trim()) && i.mode);
    onValidation?.(valid);
    onChange({
      speakingItems: items.map((i) => ({
        mode: i.mode,
        task: i.task,
        display: i.display,
        target: i.target,
        keywords: i.keywords.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
        note: i.note,
      })),
    });
  }, [items, onValidation]);

  const update = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="space-y-2 rounded-card border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <select
              value={item.mode}
              onChange={(e) => update(item.id, { mode: e.target.value })}
              className="rounded-btn border border-border bg-card px-2 py-2 text-sm"
            >
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))} className="ml-auto text-error">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <Input value={item.task} onChange={(e) => update(item.id, { task: e.target.value })} placeholder="Instruction (e.g. Say the missing word)" />
          <Input value={item.display} onChange={(e) => update(item.id, { display: e.target.value })} placeholder="Prompt shown to student" />
          <Input value={item.target} onChange={(e) => update(item.id, { target: e.target.value })} placeholder="Expected answer (for scoring)" />
          {item.mode === "roleplay" && (
            <Input value={item.keywords} onChange={(e) => update(item.id, { keywords: e.target.value })} placeholder="Keywords to score on (comma separated)" />
          )}
          <Input value={item.note} onChange={(e) => update(item.id, { note: e.target.value })} placeholder="Note (optional)" />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => setItems((p) => [...p, createItem()])}>
        <Plus className="mr-1 h-4 w-4" /> Add round
      </Button>
    </div>
  );
}
