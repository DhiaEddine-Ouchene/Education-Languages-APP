"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function JoinClassForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const join = async () => {
    if (code.trim().length < 4) return toast("error", "Enter your invite code");
    setBusy(true);
    try {
      const res = await fetch("/api/classes/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inviteCode: code.trim() }) });
      const data = await res.json();
      if (!res.ok) return toast("error", data.error ?? "Could not join class");
      toast("success", `Welcome to ${data.className}! 🎉`);
      setCode("");
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <Card><CardContent className="pt-4 flex gap-2">
      <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter invite code (e.g. AB3D9K)" maxLength={8} />
      <Button onClick={join} disabled={busy}>{busy ? "Joining..." : "Join class"}</Button>
    </CardContent></Card>
  );
}
