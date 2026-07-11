"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  language: z.string().min(2, "Language is required"),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

type LessonInput = { title: string; type: string; content: string };
type GameOption = { id: string; title: string };
type Props = {
  games: GameOption[];
  initial?: {
    id: string; title: string; description: string; language: string; level: string;
    coverImage: string | null; price: number; isPublished: boolean; isMarketplace: boolean;
    lessons: LessonInput[];
  };
};

const steps = ["Basics", "Lessons", "Games", "Publish"];

export function CourseBuilder({ games, initial }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    language: initial?.language ?? "Spanish",
    level: initial?.level ?? "A1",
    coverImage: initial?.coverImage ?? "",
    price: initial?.price ?? 0,
    isPublished: initial?.isPublished ?? false,
    isMarketplace: initial?.isMarketplace ?? false,
  });
  const [lessons, setLessons] = useState<LessonInput[]>(initial?.lessons?.filter((l) => l.type !== "game") ?? []);
  const [attachedGames, setAttachedGames] = useState<string[]>(
    initial?.lessons?.filter((l) => l.type === "game").map((l) => l.content) ?? []
  );

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    const res = courseSchema.safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const uploadCover = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
    if (!res.ok) return toast("error", "Cover upload failed");
    const { url } = await res.json();
    set("coverImage", url);
    toast("success", "Cover uploaded");
  };

  const move = (i: number, dir: -1 | 1) => {
    setLessons((ls) => {
      const next = [...ls];
      const j = i + dir;
      if (j < 0 || j >= next.length) return next;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = async () => {
    if (!validateStep1()) { setStep(0); return; }
    setSaving(true);
    try {
      const allLessons = [
        ...lessons.map((l, i) => ({ ...l, order: i })),
        ...attachedGames.map((gid, i) => ({ title: games.find((g) => g.id === gid)?.title ?? "Game", type: "game", content: gid, order: lessons.length + i })),
      ];
      const res = await fetch(initial ? `/api/courses/${initial.id}` : "/api/courses", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), lessons: allLessons }),
      });
      if (!res.ok) { toast("error", "Failed to save course"); return; }
      toast("success", initial ? "Course updated" : "Course created");
      router.push("/dashboard/courses");
      router.refresh();
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className={cn("flex-1 text-xs py-2 rounded-btn border", i === step ? "border-primary bg-primary-light text-primary-dark font-medium" : "border-border text-txt-secondary")}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <Card><CardContent className="pt-5 space-y-4">
        {step === 0 && (<>
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Spanish for beginners" /><FieldError message={errors.title} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What will students learn?" /><FieldError message={errors.description} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Language</Label><Select value={form.language} onChange={(e) => set("language", e.target.value)}>{["Spanish", "French", "German", "English", "Italian", "Japanese"].map((l) => <option key={l}>{l}</option>)}</Select></div>
            <div><Label>Level</Label><Select value={form.level} onChange={(e) => set("level", e.target.value)}>{["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l}>{l}</option>)}</Select></div>
          </div>
          <div>
            <Label>Cover image</Label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} className="text-sm" />
            {form.coverImage && <img src={form.coverImage} alt="cover" className="mt-2 h-24 rounded-card object-cover" />}
          </div>
        </>)}

        {step === 1 && (<>
          {lessons.map((l, i) => (
            <div key={i} className="border border-border rounded-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input value={l.title} onChange={(e) => setLessons((ls) => ls.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Lesson title" />
                <Button size="sm" variant="ghost" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setLessons((ls) => ls.filter((_, j) => j !== i))} aria-label="Delete"><Trash2 className="h-4 w-4 text-error" /></Button>
              </div>
              <Textarea value={l.content} onChange={(e) => setLessons((ls) => ls.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)))} placeholder="Lesson content (markdown supported)" />
            </div>
          ))}
          <Button variant="outline" onClick={() => setLessons((ls) => [...ls, { title: "", type: "text", content: "" }])}><Plus className="h-4 w-4" /> Add lesson</Button>
        </>)}

        {step === 2 && (<>
          <p className="text-sm text-txt-secondary">Attach games to this course. They appear as interactive lessons.</p>
          {games.length === 0 ? (
            <p className="text-sm">You have no games yet. <a href="/dashboard/games/new" className="text-primary">Build one</a>.</p>
          ) : (
            <div className="space-y-2">
              {games.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm border border-border rounded-btn px-3 py-2">
                  <input type="checkbox" checked={attachedGames.includes(g.id)} onChange={(e) => setAttachedGames((a) => (e.target.checked ? [...a, g.id] : a.filter((x) => x !== g.id)))} />
                  {g.title}
                </label>
              ))}
            </div>
          )}
        </>)}

        {step === 3 && (<>
          <div><Label>Price (USD, 0 = free)</Label><Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Publish course</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isMarketplace} onChange={(e) => set("isMarketplace", e.target.checked)} /> List on marketplace (requires admin approval)</label>
        </>)}
      </CardContent></Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => { if (step === 0 && !validateStep1()) return; setStep(step + 1); }}>Next</Button>
        ) : (
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : initial ? "Save changes" : "Create course"}</Button>
        )}
      </div>
    </div>
  );
}
