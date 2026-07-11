"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Volume2 } from "lucide-react";

type Item = { id: string; word: string; translation: string; audioUrl: string | null; imageUrl: string | null; exampleSentence: string | null };
type Set = { id: string; name: string; language: string; items: Item[] };

export function VocabularyManager({ sets }: { sets: Set[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(sets[0]?.id ?? null);
  const [newSet, setNewSet] = useState({ name: "", language: "Spanish" });
  const [word, setWord] = useState({ word: "", translation: "", exampleSentence: "", audioUrl: "", imageUrl: "" });
  const [busy, setBusy] = useState(false);
  const current = sets.find((s) => s.id === selected);

  const createSet = async () => {
    if (newSet.name.trim().length < 2) return toast("error", "Set name is required");
    setBusy(true);
    try {
      const res = await fetch("/api/vocabulary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSet) });
      if (!res.ok) return toast("error", "Failed to create set");
      toast("success", "Set created");
      setNewSet({ name: "", language: "Spanish" });
      router.refresh();
    } finally { setBusy(false); }
  };

  const uploadMedia = async (file: File, kind: "audio" | "image") => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/upload/${kind}`, { method: "POST", body: fd });
    if (!res.ok) return toast("error", "Upload failed");
    const { url } = await res.json();
    setWord((w) => ({ ...w, [kind === "audio" ? "audioUrl" : "imageUrl"]: url }));
    toast("success", "Uploaded");
  };

  const addWord = async () => {
    if (!current) return;
    if (!word.word.trim() || !word.translation.trim()) return toast("error", "Word and translation are required");
    setBusy(true);
    try {
      const res = await fetch(`/api/vocabulary/${current.id}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(word) });
      if (!res.ok) return toast("error", "Failed to add word");
      toast("success", "Word added");
      setWord({ word: "", translation: "", exampleSentence: "", audioUrl: "", imageUrl: "" });
      router.refresh();
    } finally { setBusy(false); }
  };

  const deleteSet = async (id: string) => {
    if (!confirm("Delete this set and all its words?")) return;
    const res = await fetch(`/api/vocabulary/${id}`, { method: "DELETE" });
    if (!res.ok) return toast("error", "Failed to delete");
    toast("success", "Set deleted");
    if (selected === id) setSelected(null);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <div className="space-y-3">
        <Card><CardContent className="pt-4 space-y-2">
          <Label>New set</Label>
          <Input placeholder="Set name (e.g. Fruits)" value={newSet.name} onChange={(e) => setNewSet({ ...newSet, name: e.target.value })} />
          <Select value={newSet.language} onChange={(e) => setNewSet({ ...newSet, language: e.target.value })}>{["Spanish", "French", "German", "English", "Italian", "Japanese"].map((l) => <option key={l}>{l}</option>)}</Select>
          <Button size="sm" className="w-full" onClick={createSet} disabled={busy}><Plus className="h-4 w-4" /> Create set</Button>
        </CardContent></Card>
        <div className="space-y-1">
          {sets.map((s) => (
            <div key={s.id} className={cn("flex items-center justify-between rounded-btn border px-3 py-2 cursor-pointer", selected === s.id ? "border-primary bg-primary-light" : "border-border bg-card")} onClick={() => setSelected(s.id)}>
              <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-txt-secondary">{s.language} · {s.items.length} words</p></div>
              <button onClick={(e) => { e.stopPropagation(); deleteSet(s.id); }} aria-label="Delete set"><Trash2 className="h-4 w-4 text-error" /></button>
            </div>
          ))}
        </div>
      </div>

      <Card><CardContent className="pt-4">
        {!current ? (
          <p className="text-sm text-txt-secondary py-10 text-center">Create or select a set to add words.</p>
        ) : (
          <>
            <p className="font-heading font-semibold mb-3">{current.name}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <Input placeholder="Word" value={word.word} onChange={(e) => setWord({ ...word, word: e.target.value })} />
              <Input placeholder="Translation" value={word.translation} onChange={(e) => setWord({ ...word, translation: e.target.value })} />
            </div>
            <Input placeholder="Example sentence (optional)" value={word.exampleSentence} onChange={(e) => setWord({ ...word, exampleSentence: e.target.value })} className="mb-2" />
            <div className="flex flex-wrap gap-3 items-center mb-3 text-xs">
              <label className="cursor-pointer text-primary">🎧 Audio<input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], "audio")} /></label>
              {word.audioUrl && <span className="text-accent">audio ✓</span>}
              <label className="cursor-pointer text-primary">🖼️ Image<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], "image")} /></label>
              {word.imageUrl && <span className="text-accent">image ✓</span>}
              <Button size="sm" onClick={addWord} disabled={busy}><Plus className="h-4 w-4" /> Add word</Button>
            </div>
            <ul className="divide-y divide-border">
              {current.items.map((i) => (
                <li key={i.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{i.word}</span> <span className="text-txt-secondary">→ {i.translation}</span>
                    {i.exampleSentence && <p className="text-xs text-txt-secondary italic">{i.exampleSentence}</p>}
                  </div>
                  {i.audioUrl && <Volume2 className="h-4 w-4 text-primary" />}
                </li>
              ))}
              {current.items.length === 0 && <li className="py-6 text-center text-sm text-txt-secondary">No words yet. Add your first word above.</li>}
            </ul>
          </>
        )}
      </CardContent></Card>
    </div>
  );
}
