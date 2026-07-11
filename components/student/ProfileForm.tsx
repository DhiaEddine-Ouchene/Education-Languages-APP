"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

export function ProfileForm({ name }: { name: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (value.trim().length < 2) return toast("error", "Name is too short");
    setBusy(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: value.trim() }) });
      if (!res.ok) return toast("error", "Failed to update profile");
      toast("success", "Profile updated");
      router.refresh();
    } finally { setBusy(false); }
  };

  const uploadAvatar = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
    if (!res.ok) return toast("error", "Upload failed");
    const { url } = await res.json();
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: url }) });
    toast("success", "Avatar updated");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div><Label>Name</Label><Input value={value} onChange={(e) => setValue(e.target.value)} /></div>
        <div>
          <Label>Avatar</Label>
          <input type="file" accept="image/*" className="text-sm" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        </div>
        <Button size="sm" onClick={save} disabled={busy}>Save</Button>
      </CardContent>
    </Card>
  );
}
