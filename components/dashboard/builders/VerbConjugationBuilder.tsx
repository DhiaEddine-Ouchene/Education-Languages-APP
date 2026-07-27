"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { BuilderProps } from "./index";

const DEFAULT_PRONOUNS: Record<string, string[]> = {
  English: ["I", "You", "He/She", "We", "They"],
  French: ["Je", "Tu", "Il/Elle", "Nous", "Vous", "Ils/Elles"],
  Spanish: ["Yo", "Tú", "Él/Ella", "Nosotros", "Vosotros", "Ellos/Ellas"],
  German: ["Ich", "Du", "Er/Sie", "Wir", "Ihr", "Sie"],
  Arabic: ["أنا", "أنت", "هو/هي", "نحن", "أنتم", "هم"],
};

const TENSES = ["Present", "Past", "Future", "Present Perfect", "Past Perfect", "Present Continuous", "Past Continuous", "Future Simple"];

export function VerbConjugationBuilder({ onChange, initial, onValidation }: BuilderProps) {
  const [verb, setVerb] = useState((initial?.verb as string) || "");
  const [tense, setTense] = useState((initial?.tense as string) || "Present");
  const [language, setLanguage] = useState("English");
  const [forms, setForms] = useState<Record<string, string>>(() => {
    if (initial?.forms) return initial.forms as Record<string, string>;
    return Object.fromEntries((DEFAULT_PRONOUNS["English"] || []).map((p) => [p, ""]));
  });

  const pronouns = DEFAULT_PRONOUNS[language] || DEFAULT_PRONOUNS["English"];

  useEffect(() => {
    setForms((prev) => { const u = { ...prev }; pronouns.forEach((p) => { if (!(p in u)) u[p] = ""; }); return u; });
  }, [language]);

  useEffect(() => {
    const valid = verb.trim().length > 0 && Object.values(forms).some((v) => v.trim());
    onValidation?.(valid);
    onChange({ verb: verb.trim(), tense, forms });
  }, [verb, tense, forms, onChange, onValidation]);

  const updateForm = (pronoun: string, value: string) => setForms((prev) => ({ ...prev, [pronoun]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-txt-secondary mb-1 block">Verb</label>
          <Input value={verb} onChange={(e) => setVerb(e.target.value)} placeholder="e.g. to be" className="text-sm font-medium" />
        </div>
        <div>
          <label className="text-xs font-medium text-txt-secondary mb-1 block">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            {Object.keys(DEFAULT_PRONOUNS).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-txt-secondary mb-1 block">Tense</label>
          <select value={tense} onChange={(e) => setTense(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            {TENSES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="grid grid-cols-2 gap-px bg-border/40">
          <div className="p-3 bg-primary/[0.03] text-xs font-semibold text-txt-secondary uppercase tracking-wider text-center">Pronoun</div>
          <div className="p-3 bg-primary/[0.03] text-xs font-semibold text-txt-secondary uppercase tracking-wider text-center">Form</div>
          {pronouns.map((pronoun) => (
            <div key={pronoun} className="contents">
              <div className="p-3 text-sm font-medium text-txt bg-card flex items-center justify-center border-t border-border/30">{pronoun}</div>
              <div className="p-2 bg-card border-t border-border/30">
                <Input value={forms[pronoun] || ""} onChange={(e) => updateForm(pronoun, e.target.value)} placeholder="form..." className="text-sm h-9 text-center" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {verb.trim() && (
        <div className="rounded-xl bg-primary/[0.03] border border-primary/10 p-4">
          <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">Preview — {verb} ({tense})</p>
          <div className="flex flex-wrap gap-2">
            {pronouns.map((p) => (
              <span key={p} className="text-xs bg-card px-2 py-1 rounded-lg border border-border/40">
                <span className="text-txt-secondary">{p}</span> <span className="text-primary font-semibold">{forms[p] || "___"}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
