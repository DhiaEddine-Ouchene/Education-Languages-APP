"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Trash2, Plus } from "lucide-react";

type Promo = { code: string; discountPct: number };
type Props = { revenueSharePct: number; promoCodes: Promo[]; emailTemplates: Record<string, string> };

export function PlatformSettingsForm({ revenueSharePct, promoCodes, emailTemplates }: Props) {
  const router = useRouter();
  const [share, setShare] = useState(revenueSharePct);
  const [promos, setPromos] = useState<Promo[]>(promoCodes);
  const [newPromo, setNewPromo] = useState({ code: "", discountPct: 10 });
  const [welcomeTemplate, setWelcomeTemplate] = useState(emailTemplates.welcome ?? "Welcome to EduPlay, {{name}}!");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (share < 0 || share > 100) return toast("error", "Revenue share must be 0-100");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revenueSharePct: share, promoCodes: promos, emailTemplates: { welcome: welcomeTemplate } }),
      });
      if (!res.ok) return toast("error", "Failed to save settings");
      toast("success", "Settings saved");
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Revenue share</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-3">
          <div><Label>Platform share (%)</Label><Input type="number" min={0} max={100} value={share} onChange={(e) => setShare(Number(e.target.value))} className="w-28" /></div>
          <p className="text-sm text-txt-secondary pb-2">Creators keep {100 - share}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Promo codes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {promos.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm border border-border rounded-btn px-3 py-2">
              <span className="font-mono font-medium flex-1">{p.code}</span>
              <span className="text-txt-secondary">{p.discountPct}% off</span>
              <button onClick={() => setPromos(promos.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="h-4 w-4 text-error" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="CODE2026" value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} />
            <Input type="number" min={1} max={100} value={newPromo.discountPct} onChange={(e) => setNewPromo({ ...newPromo, discountPct: Number(e.target.value) })} className="w-24" />
            <Button variant="outline" onClick={() => { if (newPromo.code.trim()) { setPromos([...promos, newPromo]); setNewPromo({ code: "", discountPct: 10 }); } }}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Email templates</CardTitle></CardHeader>
        <CardContent>
          <Label>Welcome email (use {"{{name}}"} placeholder)</Label>
          <Textarea value={welcomeTemplate} onChange={(e) => setWelcomeTemplate(e.target.value)} />
        </CardContent>
      </Card>

      <Button onClick={save} disabled={busy}>{busy ? "Saving..." : "Save settings"}</Button>
    </div>
  );
}
