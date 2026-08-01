"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuilderProps } from "./index";

type Rule = { id: string; op: string; a: string; b: string };
const RULE_OPS: { value: string; label: string; paramLabel: string; needsB?: boolean }[] = [
  { value: "minWords", label: "At least N words", paramLabel: "N" },
  { value: "minSentences", label: "At least N sentences", paramLabel: "N" },
  { value: "containsWord", label: "Uses a specific word", paramLabel: "word" },
  { value: "includes", label: "Uses N of these words", paramLabel: "words (comma)", needsB: true },
  { value: "startsWith", label: "Starts with", paramLabel: "text" },
  { value: "endsWith", label: "Ends with", paramLabel: "text" },
];

function createRule(overrides?: Partial<Rule>): Rule {
  return { id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, op: "minWords", a: "", b: "", ...overrides };
}

/** Builder for WRITING_RUBRIC: prompt + word bank + serializable rubric rules. */
export function WritingBuilder({ onChange, initial, onValidation }: BuilderProps) {
  const [prompt, setPrompt] = useState((initial?.prompt as string) || "");
  const [wordBank, setWordBank] = useState(((initial?.wordBank as string[]) || []).join(", "));
  const [starter, setStarter] = useState((initial?.starter as string) || "");
  const [note, setNote] = useState((initial?.note as string) || "");
  const [teacherReview, setTeacherReview] = useState(!!(initial?.teacherReview));
  const [rules, setRules] = useState<Rule[]>(
    ((initial?.rules as Rule[]) || []).map((r) => ({ ...r, id: r.id || createRule().id }))
  );

  useEffect(() => {
    const wb = wordBank.split(",").map((s) => s.trim()).filter(Boolean);
    const valid = prompt.trim().length >= 10 && rules.length >= 1 && rules.every((r) => r.a.trim());
    onValidation?.(valid);
    onChange({ prompt, wordBank: wb, starter, note, teacherReview, rules });
  }, [prompt, wordBank, starter, note, teacherReview, rules, onValidation]);

  const updateRule = (id: string, patch: Partial<Rule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-txt-secondary">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your last holiday. Use at least 3 words from the word bank."
          rows={3}
          className="w-full rounded-btn border border-border bg-card p-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-txt-secondary">Word bank (comma separated, optional)</label>
        <Input value={wordBank} onChange={(e) => setWordBank(e.target.value)} placeholder="visited, delicious, beautiful" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-txt-secondary">Rubric rules</label>
        <div className="space-y-2">
          {rules.map((rule) => {
            const meta = RULE_OPS.find((o) => o.value === rule.op) || RULE_OPS[0];
            return (
              <div key={rule.id} className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-card p-2">
                <select
                  value={rule.op}
                  onChange={(e) => updateRule(rule.id, { op: e.target.value })}
                  className="rounded-btn border border-border bg-card px-2 py-2 text-sm"
                >
                  {RULE_OPS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <Input
                  value={rule.a}
                  onChange={(e) => updateRule(rule.id, { a: e.target.value })}
                  placeholder={meta.paramLabel}
                  className="w-40"
                />
                {meta.needsB && (
                  <Input
                    value={rule.b}
                    onChange={(e) => updateRule(rule.id, { b: e.target.value })}
                    placeholder="count"
                    className="w-24"
                  />
                )}
                <button type="button" onClick={() => setRules((p) => p.filter((r) => r.id !== rule.id))} className="text-error">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setRules((p) => [...p, createRule()])}>
          <Plus className="mr-1 h-4 w-4" /> Add rule
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input value={starter} onChange={(e) => setStarter(e.target.value)} placeholder="Starter text (optional)" />
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={teacherReview} onChange={(e) => setTeacherReview(e.target.checked)} />
        Teacher review (not auto-graded)
      </label>
    </div>
  );
}
