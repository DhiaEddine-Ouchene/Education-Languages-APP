"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Flame } from "lucide-react";

type Branding = { brandName: string; brandLogo: string; primaryColor: string; accentColor: string; customDomain: string; domainVerified: boolean };

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded-btn border border-border cursor-pointer" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="w-28" />
      </div>
    </div>
  );
}

export function BrandingForm({ initial }: { initial: Branding }) {
  const router = useRouter();
  const [b, setB] = useState(initial);
  const [busy, setBusy] = useState(false);

  const uploadLogo = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
    if (!res.ok) return toast("error", "Logo upload failed");
    const { url } = await res.json();
    setB({ ...b, brandLogo: url });
    toast("success", "Logo uploaded");
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/branding", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
      if (!res.ok) return toast("error", "Failed to save branding");
      toast("success", "Branding saved");
      router.refresh();
    } finally { setBusy(false); }
  };

  const verifyDomain = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/branding/domain/verify", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.verified) toast("success", "Domain verified!");
      else toast("error", data.error ?? "Verification failed. Point a CNAME to the app domain first.");
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card><CardContent className="pt-5 space-y-4">
        <div><Label>App name</Label><Input value={b.brandName} onChange={(e) => setB({ ...b, brandName: e.target.value })} placeholder="My Language Academy" /></div>
        <div>
          <Label>Logo</Label>
          <label className="block border-2 border-dashed border-border rounded-card p-6 text-center text-sm text-txt-secondary cursor-pointer hover:border-primary">
            {b.brandLogo ? <img src={b.brandLogo} alt="logo" className="h-12 mx-auto" /> : "Drop or click to upload your logo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker label="Primary color" value={b.primaryColor} onChange={(v) => setB({ ...b, primaryColor: v })} />
          <ColorPicker label="Accent color" value={b.accentColor} onChange={(v) => setB({ ...b, accentColor: v })} />
        </div>
        <div>
          <Label>Custom domain</Label>
          <div className="flex gap-2">
            <Input value={b.customDomain} onChange={(e) => setB({ ...b, customDomain: e.target.value })} placeholder="learn.myacademy.com" />
            <Button variant="outline" onClick={verifyDomain} disabled={busy || !initial.customDomain}>Verify</Button>
          </div>
          <p className="text-xs mt-1">{initial.domainVerified ? <Badge variant="accent">Verified</Badge> : <span className="text-txt-secondary">Save first, add a CNAME record pointing to the app domain, then verify.</span>}</p>
        </div>
        <Button onClick={save} disabled={busy} className="w-full">{busy ? "Saving..." : "Save branding"}</Button>
      </CardContent></Card>

      {/* Live phone preview */}
      <div className="flex justify-center items-start">
        <div className="w-64 rounded-[2rem] border-8 border-txt-primary bg-background p-3 shadow-hover" style={{ "--primary": b.primaryColor, "--accent": b.accentColor } as React.CSSProperties}>
          <div className="flex items-center gap-2 mb-3">
            {b.brandLogo ? <img src={b.brandLogo} alt="" className="h-6 w-6 rounded" /> : <div className="h-6 w-6 rounded" style={{ background: b.primaryColor }} />}
            <span className="font-heading font-bold text-sm">{b.brandName || "EduPlay"}</span>
          </div>
          <div className="rounded-card p-3 text-white text-xs mb-2" style={{ background: b.primaryColor }}>
            <p className="flex items-center gap-1 font-semibold"><Flame className="h-3 w-3" /> 7 day streak!</p>
            <p className="opacity-80">Keep it going</p>
          </div>
          <div className="bg-card rounded-card p-3 mb-2">
            <p className="text-xs font-medium mb-1">Level 4</p>
            <div className="h-2 rounded-pill bg-border"><div className="h-2 rounded-pill w-2/3" style={{ background: b.accentColor }} /></div>
          </div>
          <div className="bg-card rounded-card p-3">
            <p className="text-xs font-medium mb-2">Today&apos;s games</p>
            {["Fruit quiz 🍎", "Verbs speed round ⚡"].map((g) => (
              <div key={g} className="text-xs border border-border rounded-btn px-2 py-1.5 mb-1 flex justify-between">
                <span>{g}</span><span style={{ color: b.accentColor }}>Play</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
