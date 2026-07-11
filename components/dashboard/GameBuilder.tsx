"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

const GAME_TYPES = [
  { key: "FLASHCARD", label: "Flashcard", emoji: "🃏" },
  { key: "FILL_BLANK", label: "Fill blank", emoji: "✏️" },
  { key: "DRAG_DROP", label: "Drag & drop", emoji: "🧩" },
  { key: "QUIZ", label: "Quiz", emoji: "❓" },
  { key: "DICTATION", label: "Dictation", emoji: "🎧" },
  { key: "MEMORY", label: "Memory", emoji: "🧠" },
  { key: "SPEED_ROUND", label: "Speed round", emoji: "⚡" },
  { key: "STORY", label: "Story", emoji: "📖" },
];

type VocabSet = { id: string; name: string; items: { id: string; word: string; translation: string }[] };
type Props = {
  sets: VocabSet[];
  initial?: { id: string; title: string; type: string; vocabularySetId: string; settings: Record<string, unknown>; isPublished: boolean; isMarketplace: boolean; price: number };
};

export function GameBuilder({ sets, initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState(initial?.type ?? "FLASHCARD");
  const [setId, setSetId] = useState(initial?.vocabularySetId ?? sets[0]?.id ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [isMarketplace, setIsMarketplace] = useState(initial?.isMarketplace ?? false);
  const [price, setPrice] = useState(initial?.price ?? 0);
  const s = (initial?.settings ?? {}) as Record<string, unknown>;
  const [settings, setSettings] = useState({
    difficulty: (s.difficulty as string) ?? "medium",
    timer: (s.timer as number) ?? 30,
    hints: (s.hints as boolean) ?? true,
    audioAutoplay: (s.audioAutoplay as boolean) ?? false,
    shuffle: (s.shuffle as boolean) ?? true,
  });
  const selectedSet = sets.find((x) => x.id === setId);
  const preview = selectedSet?.items[0];

  const save = async () => {
    if (title.trim().length < 3) return setError("Title must be at least 3 characters");
    if (!setId) return setError("Select a vocabulary set");
    setError("");
    setSaving(true);
    try {
      const res = await fetch(initial ? `/api/games/${initial.id}` : "/api/games", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, vocabularySetId: setId, settings, isPublished, isMarketplace, price: Number(price) }),
      });
      if (!res.ok) { toast("error", "Failed to save game"); return; }
      toast("success", initial ? "Game updated" : "Game created");
      router.push("/dashboard/games");
      router.refresh();
    } finally { setSaving(false); }
  };

  if (sets.length === 0) {
    return <p className="text-sm text-txt-secondary">You need a vocabulary set first. <a className="text-primary" href="/dashboard/vocabulary">Create one</a>.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]"><Label>Game title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fruit vocabulary quiz" /><FieldError message={error} /></div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : initial ? "Save" : "Create game"}</Button>
        {initial && (
          <Link href={`/dashboard/games/${initial.id}/preview`}>
            <Button variant="outline" type="button"><Eye className="h-4 w-4 mr-1" /> Try Game</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-4">
        {/* Left: vocabulary */}
        <Card><CardContent className="pt-4">
          <Label>Vocabulary set</Label>
          <Select value={setId} onChange={(e) => setSetId(e.target.value)}>{sets.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
          <ul className="mt-3 space-y-1 max-h-72 overflow-y-auto">
            {selectedSet?.items.map((i) => (
              <li key={i.id} className="text-xs border border-border rounded-btn px-2 py-1.5 flex justify-between"><span>{i.word}</span><span className="text-txt-secondary">{i.translation}</span></li>
            ))}
            {selectedSet?.items.length === 0 && <li className="text-xs text-txt-secondary">This set has no words yet.</li>}
          </ul>
        </CardContent></Card>

        {/* Center: type + preview */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {GAME_TYPES.map((t) => (
              <button key={t.key} onClick={() => setType(t.key)} className={cn("px-2.5 py-1.5 rounded-btn border text-xs", type === t.key ? "border-primary bg-primary-light text-primary-dark font-medium" : "border-border text-txt-secondary")}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <div className="border border-dashed border-border rounded-card p-6 text-center bg-background">
            <p className="text-xs text-txt-secondary mb-3">Live preview</p>
            {preview ? (
              type === "FLASHCARD" ? <div className="inline-block bg-card border border-border rounded-card px-10 py-8 font-heading font-bold text-xl shadow-card">{preview.word}</div>
              : type === "QUIZ" || type === "FILL_BLANK" || type === "SPEED_ROUND" ? (
                <div><p className="font-heading font-semibold mb-3">What does “{preview.word}” mean?</p>
                  <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">{[preview.translation, "...", "...", "..."].map((o, i) => <div key={i} className="border border-border rounded-btn py-2 text-sm bg-card">{o}</div>)}</div></div>
              ) : type === "MEMORY" ? (
                <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-primary rounded-btn" />)}</div>
              ) : <p className="font-heading font-semibold">{GAME_TYPES.find((t) => t.key === type)?.label} — {preview.word} → {preview.translation}</p>
            ) : <p className="text-sm text-txt-secondary">Add words to the set to preview.</p>}
          </div>
        </CardContent></Card>

        {/* Right: settings */}
        <Card><CardContent className="pt-4 space-y-3">
          <p className="font-heading font-semibold text-sm">Settings</p>
          <div><Label>Difficulty</Label><Select value={settings.difficulty} onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select></div>
          <div><Label>Timer (seconds per question)</Label><Input type="number" min={5} value={settings.timer} onChange={(e) => setSettings({ ...settings, timer: Number(e.target.value) })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.hints} onChange={(e) => setSettings({ ...settings, hints: e.target.checked })} /> Hints</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.audioAutoplay} onChange={(e) => setSettings({ ...settings, audioAutoplay: e.target.checked })} /> Audio autoplay</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.shuffle} onChange={(e) => setSettings({ ...settings, shuffle: e.target.checked })} /> Shuffle</label>
          <hr className="border-border" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Published</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isMarketplace} onChange={(e) => setIsMarketplace(e.target.checked)} /> List on marketplace</label>
          {isMarketplace && <div><Label>Price (USD)</Label><Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>}
        </CardContent></Card>
      </div>
    </div>
  );
}
