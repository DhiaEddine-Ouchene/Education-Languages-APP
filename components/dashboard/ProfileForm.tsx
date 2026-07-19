"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Camera, Calendar, ShieldCheck } from "lucide-react";

type Props = { name: string; email: string; avatar: string | null; role: string; createdAt: string };

export function ProfileForm({ name, email, avatar, role, createdAt }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [currentAvatar, setCurrentAvatar] = useState(avatar);
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
        body: JSON.stringify({ name: displayName }),
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
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return toast("error", d.error ?? "Upload failed");
      }
      const { url } = await res.json();
      const save = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: url }),
      });
      if (!save.ok) return toast("error", "Failed to save avatar");
      setCurrentAvatar(url);
      toast("success", "Profile picture updated");
      router.refresh();
    } catch {
      toast("error", "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const joinDate = new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const roleLabel = role === "EDUCATOR" ? "Educator" : role === "SUPER_ADMIN" ? "Admin" : "Student";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-5">
          <div className="relative group h-24 w-24">
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentAvatar} alt={displayName} className="h-24 w-24 rounded-pill object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-pill bg-primary-light text-primary-dark flex items-center justify-center text-3xl font-semibold">
                {displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
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
          <div>
            <p className="text-lg font-semibold text-txt-primary">{displayName}</p>
            <p className="text-sm text-txt-secondary">{email}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-txt-secondary">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Joined {joinDate}
              </span>
            </div>
            {uploading && <p className="text-xs text-txt-secondary mt-1">Uploading\u2026</p>}
          </div>
        </div>

        <div className="space-y-3 max-w-md">
          <div>
            <Label>Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <Button onClick={saveProfile} disabled={busy}>
            {busy ? "Saving\u2026" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
