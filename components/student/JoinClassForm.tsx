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
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter invite code (e.g. AB3D9K)"
          maxLength={8}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              join();
            }
          }}
        />
        <Button onClick={join} disabled={busy} className="whitespace-nowrap shrink-0 px-5 font-semibold">
          {busy ? "Joining..." : "Join class"}
        </Button>
      </CardContent>
    </Card>
  );
}
