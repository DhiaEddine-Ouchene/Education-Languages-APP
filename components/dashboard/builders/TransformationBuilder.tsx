"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuilderProps } from "./index";

type Item = { id: string; instruction: string; prompt: string; answers: string[] };

function createItem(overrides?: Partial<Item>): Item {
  return { id: `tf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, instruction: "", prompt: "", answers: [""], ...overrides };
}

/** Builder for TRANSFORMATION: instruction + prompt + accepted answer variants. */
export function TransformationBuilder({ onChange, initial, onValidation }: BuilderProps) {
  const [items, setItems] = useState<Item[]>(
    ((initial?.transformationItems as Item[]) || []).map((i) => ({ ...i, answers: [...i.answers] }))
  );

  useEffect(() => {
    const valid = items.length >= 2 && items.every((i) => i.instruction.trim() && i.prompt.trim() && i.answers.some((a) => a.trim()));
    onValidation?.(valid);
    onChange({ transformationItems: items });
  }, [items, onValidation]);

  const update = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="space-y-2 rounded-card border border-border bg-card p-3">
          <Input value={item.instruction} onChange={(e) => update(item.id, { instruction: e.target.value })} placeholder="Instruction: Make this sentence negative" />
          <Input value={item.prompt} onChange={(e) => update(item.id, { prompt: e.target.value })} placeholder="Prompt: She likes coffee." />
          <div className="space-y-1.5">
            {item.answers.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={a}
                  onChange={(e) => update(item.id, { answers: item.answers.map((x, xi) => (xi === i ? e.target.value : x)) })}
                  placeholder={`Accepted answer ${i + 1}`}
                />
                {item.answers.length > 1 && (
                  <button type="button" onClick={() => update(item.id, { answers: item.answers.filter((_, xi) => xi !== i) })} className="text-error">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => update(item.id, { answers: [...item.answers, ""] })}>
            + Add variant
          </Button>
          <button type="button" onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))} className="mt-1 text-xs text-error">
            Remove item
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => setItems((p) => [...p, createItem()])}>
        <Plus className="mr-1 h-4 w-4" /> Add sentence
      </Button>
    </div>
  );
}
