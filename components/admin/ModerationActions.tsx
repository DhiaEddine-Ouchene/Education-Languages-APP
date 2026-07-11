"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function ModerationActions({ id, kind }: { id: string; kind: "course" | "game" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const act = async (action: "approve" | "reject") => {
    let reason = "";
    if (action === "reject") {
      reason = prompt("Rejection reason:") ?? "";
      if (!reason.trim()) return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/marketplace/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, reason }),
      });
      if (!res.ok) return toast("error", `Failed to ${action}`);
      toast("success", action === "approve" ? "Approved" : "Rejected");
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="accent" onClick={() => act("approve")} disabled={busy}>Approve</Button>
      <Button size="sm" variant="danger" onClick={() => act("reject")} disabled={busy}>Reject</Button>
    </div>
  );
}
