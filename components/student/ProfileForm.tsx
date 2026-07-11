"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

export function ProfileForm({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(avatarUrl ?? "");

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
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      if (!res.ok) return toast("error", "Upload failed");
      const { url } = await res.json();
      const update = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: url }) });
      if (!update.ok) return toast("error", "Avatar uploaded but profile update failed");
      setPreview(url);
      toast("success", "Profile picture updated");
      router.refresh();
    } finally { setUploading(false); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-pill border border-border bg-primary-light">
            {preview ? <img src={preview} alt="Profile preview" className="h-full w-full object-cover" /> : <Camera className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary-dark" />}
          </div>
          <div className="flex-1">
            <Label>Profile picture</Label>
            <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-btn border border-dashed border-border bg-background px-3 py-3 text-sm font-medium text-txt-secondary transition-colors hover:border-primary hover:text-primary">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload a new picture"}
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </label>
          </div>
        </div>

        <div>
          <Label>Name</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Your display name" />
        </div>
        <Button size="sm" onClick={save} disabled={busy}><Save className="h-4 w-4" /> {busy ? "Saving..." : "Save profile"}</Button>
      </CardContent>
    </Card>
  );
}
