"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";
import { Radio, Trophy, Copy } from "lucide-react";

type Member = { id: string; name: string; email: string; joinedAt: string; totalXP: number; level: number; streak: number };
type AssignmentRow = { id: string; gameTitle: string; dueDate: string; isLive: boolean; completions: number };
type Props = {
  cls: { id: string; name: string; language: string; level: string; inviteCode: string; members: Member[]; assignments: AssignmentRow[] };
  games: { id: string; title: string }[];
  leaderboard: { name: string; xp: number }[];
};

const tabs = ["Students", "Assignments", "Announcements", "Leaderboard"] as const;

export function ClassDetail({ cls, games, leaderboard }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Students");
  const [gameId, setGameId] = useState(games[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [busy, setBusy] = useState(false);

  const assign = async () => {
    if (!gameId || !dueDate) return toast("error", "Select a game and due date");
    setBusy(true);
    try {
      const res = await fetch(`/api/classes/${cls.id}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, dueDate }) });
      if (!res.ok) return toast("error", "Failed to assign");
      toast("success", "Game assigned. Students were notified by email.");
      router.refresh();
    } finally { setBusy(false); }
  };

  const startLive = async () => {
    if (!gameId) return toast("error", "Select a game first (Assignments tab)");
    setBusy(true);
    try {
      const res = await fetch(`/api/classes/${cls.id}/live`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId }) });
      if (!res.ok) return toast("error", "Failed to start live session");
      toast("success", "Live session started! Students see it at the top of their home.");
      router.refresh();
    } finally { setBusy(false); }
  };

  const announce = async () => {
    if (announcement.trim().length < 3) return toast("error", "Write an announcement first");
    setBusy(true);
    try {
      const res = await fetch(`/api/classes/${cls.id}/announce`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: announcement }) });
      if (!res.ok) return toast("error", "Failed to send announcement");
      toast("success", "Announcement emailed to all students");
      setAnnouncement("");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl">{cls.name}</h1>
          <p className="text-sm text-txt-secondary">{cls.language} · {cls.level} · {cls.members.length} students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(cls.inviteCode); toast("success", "Invite code copied"); }}>
            <Copy className="h-4 w-4" /> {cls.inviteCode}
          </Button>
          <Button size="sm" variant="accent" onClick={startLive} disabled={busy}><Radio className="h-4 w-4" /> Live session</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 text-sm border-b-2 -mb-px", tab === t ? "border-primary text-primary font-medium" : "border-transparent text-txt-secondary")}>{t}</button>
        ))}
      </div>

      {tab === "Students" && (
        <Card><CardContent className="pt-4">
          {cls.members.length === 0 ? (
            <p className="text-sm text-txt-secondary py-8 text-center">No students yet. Share code <b>{cls.inviteCode}</b> to invite them.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-txt-secondary border-b border-border"><th className="py-2">Student</th><th>Level</th><th>XP</th><th>Streak</th><th>Joined</th></tr></thead>
              <tbody>
                {cls.members.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="py-2.5"><p className="font-medium">{m.name}</p><p className="text-xs text-txt-secondary">{m.email}</p></td>
                    <td>Lv {m.level}</td><td>{m.totalXP} XP</td><td>🔥 {m.streak}</td><td className="text-xs text-txt-secondary">{formatDate(m.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent></Card>
      )}

      {tab === "Assignments" && (
        <div className="space-y-4">
          <Card><CardContent className="pt-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label>Game</Label><Select value={gameId} onChange={(e) => setGameId(e.target.value)}>{games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</Select></div>
            <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <Button onClick={assign} disabled={busy}>Assign game</Button>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            {cls.assignments.length === 0 ? (
              <p className="text-sm text-txt-secondary py-6 text-center">No assignments yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {cls.assignments.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.gameTitle}</span>
                      {a.isLive && <Badge variant="error">LIVE</Badge>}
                    </div>
                    <div className="text-xs text-txt-secondary">Due {formatDate(a.dueDate)} · {a.completions}/{cls.members.length} completed</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent></Card>
        </div>
      )}

      {tab === "Announcements" && (
        <Card><CardContent className="pt-4 space-y-3">
          <Label>Send an announcement (emailed to all students)</Label>
          <Textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Reminder: quiz on Friday!" />
          <Button onClick={announce} disabled={busy}>Send announcement</Button>
        </CardContent></Card>
      )}

      {tab === "Leaderboard" && (
        <Card><CardContent className="pt-4">
          <p className="font-heading font-semibold mb-3 flex items-center gap-2"><Trophy className="h-5 w-5 text-warning" /> Weekly XP ranking</p>
          <ol className="space-y-2">
            {leaderboard.map((s, i) => (
              <li key={s.name} className="flex items-center justify-between text-sm border border-border rounded-btn px-3 py-2">
                <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {s.name}</span>
                <span className="font-semibold">{s.xp} XP</span>
              </li>
            ))}
            {leaderboard.length === 0 && <p className="text-sm text-txt-secondary py-6 text-center">No activity this week.</p>}
          </ol>
        </CardContent></Card>
      )}
    </div>
  );
}
