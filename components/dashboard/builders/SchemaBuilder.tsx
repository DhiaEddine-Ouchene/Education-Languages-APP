"use client";

// ── SchemaBuilder ──
// ONE generic, schema-driven teacher builder that authors content for EVERY game
// type. It reads the field definitions from `lib/builder-schemas.ts` (resolved per
// game type via its play engine), renders a form, and emits engine-ready `data`.
// A live preview renders the real play engine from the current form values, so the
// teacher sees exactly what the student will see as they type.
//
// This replaces the fragmented per-type builders (FlashcardPairBuilder,
// QuizQuestionBuilder, SentenceFillBuilder, …) with a single source of truth that
// stays in lock-step with the engines.

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FolderGame from "@/components/games/engines/FolderGame";
import type { GameTypeMeta } from "@/lib/game-type-metadata";
import {
  schemaForType,
  buildEngineData,
  engineDataToForm,
  emptyForm,
  exampleEngineData,
  hasEngineContent,
  previewSignature,
  type SchemaField,
  type FormValues,
} from "@/lib/builder-schemas";

export type SchemaBuilderProps = {
  gameMeta: GameTypeMeta;
  /** engine-ready `data` to seed the form (edit / template / AI autofill) */
  initial?: Record<string, unknown>;
  /** fires with engine-ready `data` on every edit */
  onChange: (engineData: Record<string, unknown>) => void;
  onValidation?: (isValid: boolean) => void;
  generating?: boolean;
};

// Catches crashes from partial/empty form data while previewing.
class PreviewBoundary extends React.Component<{ children: React.ReactNode }, { err: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { err: false };
  }
  static getDerivedStateFromError() {
    return { err: true };
  }
  componentDidUpdate(prev: { children: React.ReactNode }) {
    if (prev.children !== this.props.children && this.state.err) this.setState({ err: false });
  }
  render() {
    if (this.state.err) {
      return (
        <div className="rounded-card border border-border bg-card p-6 text-center">
          <p className="text-sm text-txt-secondary">Keep filling in the fields — the game needs a bit more info to preview.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const FIELD_LABEL = "mb-1 block text-xs font-semibold uppercase tracking-wide text-txt-secondary";
const MULTILINE_TYPES = ["textarea", "lines", "pairs", "defs", "items", "entries", "rules", "dialogue", "cards"];

function Field({ f, value, onChange }: { f: SchemaField; value: any; onChange: (v: any) => void }) {
  const multiline = MULTILINE_TYPES.includes(f.type);
  return (
    <div>
      <label className={FIELD_LABEL}>{f.label}</label>
      {f.type === "bool" ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-txt-secondary">{f.ph || "Enable"}</span>
        </label>
      ) : f.type === "select" ? (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-btn border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {(f.opts || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          value={value ?? ""}
          placeholder={f.ph}
          onChange={(e) => onChange(e.target.value)}
          rows={f.type === "textarea" ? 3 : 4}
          className="w-full rounded-btn border border-border bg-card p-3 text-sm outline-none focus:border-primary"
        />
      ) : (
        <Input
          value={value ?? ""}
          placeholder={f.ph}
          inputMode={f.type === "number" ? "numeric" : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function SchemaBuilder({ gameMeta, initial, onChange, onValidation, generating }: SchemaBuilderProps) {
  const type = gameMeta.type;
  const schema = useMemo(() => schemaForType(type), [type]);

  // Seed once on mount. External re-seeds (type switch, AI autofill, template load)
  // are driven by the host remounting this component via a `key` change.
  const seed = useMemo(
    () => (initial && hasEngineContent(type, initial) ? engineDataToForm(type, initial) : emptyForm(type)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [dataVals, setDataVals] = useState<FormValues>(seed.dataVals);
  const [rounds, setRounds] = useState<FormValues[]>(seed.rounds);

  const dataFields = schema.kind === "data" ? schema.fields : schema.dataFields || [];
  const roundFields = schema.kind === "rounds" ? schema.fields : [];

  const engineData = useMemo(() => buildEngineData(type, dataVals, rounds), [type, dataVals, rounds]);

  useEffect(() => {
    onChange(engineData);
    onValidation?.(hasEngineContent(type, engineData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineData]);

  function loadExample() {
    const { dataVals: dv, rounds: rs } = engineDataToForm(type, exampleEngineData(type));
    setDataVals(dv);
    setRounds(rs);
  }
  function clearForm() {
    const { dataVals: dv, rounds: rs } = emptyForm(type);
    setDataVals(dv);
    setRounds(rs);
  }

  const hasContent = hasEngineContent(type, engineData);
  const sig = previewSignature(type, engineData);
  const previewGame = {
    id: `preview:${sig}`,
    cat: gameMeta.category,
    emoji: gameMeta.emoji,
    title: gameMeta.title || schema.name,
    engine: schema.engine,
    data: engineData,
  };

  return (
    <div className="space-y-5">
      {/* What this game looks like + example controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-background p-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-txt-secondary">What this game looks like</p>
          <p className="truncate text-sm text-txt-primary">{schema.exampleText || gameMeta.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={loadExample} disabled={generating}>
            <Download className="mr-1 h-4 w-4" /> Load example
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearForm} disabled={generating}>
            <Eraser className="mr-1 h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      {/* Top-level (data) fields */}
      {dataFields.length > 0 && (
        <div className="space-y-4 rounded-card border border-border bg-card p-4">
          {dataFields.map((f) => (
            <Field key={f.k} f={f} value={dataVals[f.k]} onChange={(v) => setDataVals((p) => ({ ...p, [f.k]: v }))} />
          ))}
        </div>
      )}

      {/* Per-round fields */}
      {schema.kind === "rounds" && (
        <div className="space-y-4">
          {rounds.map((r, i) => (
            <div key={i} className="rounded-card border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-txt-primary">Round {i + 1}</span>
                {rounds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRounds((p) => p.filter((_, j) => j !== i))}
                    className="inline-flex items-center gap-1 text-xs text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {roundFields.map((f) => (
                  <Field
                    key={f.k}
                    f={f}
                    value={r[f.k]}
                    onChange={(v) => setRounds((p) => p.map((rr, j) => (j === i ? { ...rr, [f.k]: v } : rr)))}
                  />
                ))}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRounds((p) => [...p, emptyForm(type).rounds[0]])}
          >
            <Plus className="mr-1 h-4 w-4" /> Add round
          </Button>
        </div>
      )}

      {/* Live preview */}
      <div className="rounded-card border border-border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-txt-primary">👁 Live preview</span>
          <span className="text-xs text-txt-secondary">Updates as you type — this is what students see.</span>
        </div>
        {hasContent ? (
          <PreviewBoundary key={previewGame.id}>
            <div className="fg-preview">
              <FolderGame game={previewGame} onComplete={() => {}} />
            </div>
          </PreviewBoundary>
        ) : (
          <div className="rounded-card border border-dashed border-border bg-card p-6 text-center">
            <p className="text-sm text-txt-secondary">
              Start typing your own words and sentences (or load the example) — your game appears here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchemaBuilder;
