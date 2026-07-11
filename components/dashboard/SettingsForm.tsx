"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Camera, Calendar, ShieldCheck } from "lucide-react";

type Props = {
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  createdAt: string;
};

export function SettingsForm({ name, email, avatar, role, createdAt }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState({ name });
  const [currentAvatar, setCurrentAvatar] = useState(avatar);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [notif, setNotif] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profile.name }) });
      if (!res.ok) return toast("error", "Failed to update profile");
      toast("success", "Profile updated");
      router.refresh();
    } finally { setBusy(false); }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      if (!res.ok) return toast("error", "Upload failed");
      const { url } = await res.json();
      await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: url }) });
      setCurrentAvatar(url);
      toast("success", "Avatar updated");
      router.refresh();
    } catch {
      toast("error", "Avatar upload failed");
    } finally { setUploading(false); }
  };

  const changePassword = async () => {
    if (pw.next.length < 8) return toast("error", "New password must be at least 8 characters");
    setBusy(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }) });
      if (!res.ok) { const d = await res.json(); return toast("error", d.error ?? "Failed to change password"); }
      toast("success", "Password changed");
      setPw({ current: "", next: "" });
    } finally { setBusy(false); }
  };

  const deleteAccount = async () => {
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    const res = await fetch("/api/settings", { method: "DELETE" });
    if (!res.ok) return toast("error", "Failed to delete account");
    await signOut({ callbackUrl: "/" });
  };

  const joinDate = new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const roleLabel = role === "EDUCATOR" ? "Educator" : role === "SUPER_ADMIN" ? "Admin" : "Student";

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className="h-20 w-20 rounded-pill object-cover border-2 border-border shadow-card" />
              ) : (
                <div className="h-20 w-20 rounded-pill bg-primary text-white flex items-center justify-center font-heading font-bold text-2xl border-2 border-primary shadow-card">
                  {profile.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-pill bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-lg truncate">{profile.name}</p>
              <p className="text-sm text-txt-secondary truncate">{email}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-txt-secondary">
                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />{roleLabel}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {joinDate}</span>
              </div>
            </div>
          </div>
          {uploading && <p className="text-xs text-primary mt-2 text-center">Uploading avatar...</p>}
        </CardContent>
      </Card>

      {/* Edit Name */}
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={email} disabled /></div>
          <Button size="sm" onClick={saveProfile} disabled={busy}>Save</Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle>Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Current password</Label><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
          <div><Label>New password</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <Button size="sm" onClick={changePassword} disabled={busy}>Change password</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notif} onChange={(e) => setNotif(e.target.checked)} /> Email me about student activity and sales</label>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-error">
        <CardHeader><CardTitle className="text-error">Danger zone</CardTitle></CardHeader>
        <CardContent><Button variant="danger" size="sm" onClick={deleteAccount}>Delete account</Button></CardContent>
      </Card>
    </div>
  );
}
