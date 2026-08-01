"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

export function ProfileForm({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [avatar, setAvatar] = useState(avatarUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = async () => {
    if (displayName.trim().length < 2) return toast("error", "Name must be at least 2 characters");
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      if (!res.ok) return toast("error", "Failed to update profile");
      toast("success", "Profile updated");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      if (!res.ok) return toast("error", "Upload failed");
      const { url } = await res.json();
      const save = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: url }),
      });
      if (!save.ok) return toast("error", "Avatar uploaded but failed to save");
      setAvatar(url);
      toast("success", "Profile picture updated");
      router.refresh();
    } catch {
      toast("error", "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative group h-24 w-24 shrink-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={displayName} className="h-24 w-24 rounded-pill object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-pill bg-primary-light text-primary-dark flex items-center justify-center text-3xl font-semibold">
                {displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile picture"
              className="absolute inset-0 rounded-pill bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-txt-primary">Profile picture</p>
            <p className="mt-1 text-xs text-txt-secondary">
              {uploading ? "Uploading…" : "Hover the picture and click the camera to change it."}
            </p>
          </div>
        </div>

        <div className="space-y-3 max-w-md">
          <div>
            <Label>Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />
          </div>
          <Button onClick={saveProfile} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
