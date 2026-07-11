"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

export function UserActions({ userId, role, plan }: { userId: string; role: string; plan: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const update = async (data: Record<string, string>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) return toast("error", "Update failed");
      toast("success", "User updated");
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="flex gap-1.5">
      <select disabled={busy} value={role} onChange={(e) => update({ role: e.target.value })} className="h-8 rounded-btn border border-border bg-card px-1 text-xs">
        {["SUPER_ADMIN", "EDUCATOR", "STUDENT"].map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {plan !== null && (
        <select disabled={busy} value={plan} onChange={(e) => update({ plan: e.target.value })} className="h-8 rounded-btn border border-border bg-card px-1 text-xs">
          {["FREE", "STARTER", "PRO", "SCHOOL"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      )}
    </div>
  );
}
