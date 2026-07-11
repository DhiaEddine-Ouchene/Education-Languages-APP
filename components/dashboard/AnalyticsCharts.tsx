"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download, Printer } from "lucide-react";

type Props = {
  engagement: { name: string; plays: number }[];
  timeSpent: { day: string; minutes: number }[];
  classPerf: { name: string; avgScore: number }[];
  hardestWords: { word: string; game: string; avgScore: number }[];
};

export function AnalyticsCharts({ engagement, timeSpent, classPerf, hardestWords }: Props) {
  const exportCsv = () => {
    const rows = [
      "section,name,value",
      ...engagement.map((e) => `engagement,${e.name},${e.plays}`),
      ...timeSpent.map((t) => `time_minutes,${t.day},${t.minutes}`),
      ...classPerf.map((c) => `class_avg_score,${c.name},${c.avgScore}`),
      ...hardestWords.map((w) => `hardest_word,${w.word} (${w.game}),${w.avgScore}`),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "eduplay-analytics.csv";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Export PDF</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Class performance (avg score %)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerf}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="avgScore" fill="#7F77DD" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Engagement per game (plays)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagement}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="plays" fill="#1D9E75" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Time spent (minutes, last 7 days)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSpent}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line type="monotone" dataKey="minutes" stroke="#7F77DD" strokeWidth={2} /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Most missed words</CardTitle></CardHeader>
          <CardContent>
            {hardestWords.length === 0 ? (
              <p className="text-sm text-txt-secondary py-6 text-center">Not enough data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-txt-secondary border-b border-border"><th className="py-2">Word</th><th>Game</th><th>Avg score</th></tr></thead>
                <tbody>{hardestWords.map((w, i) => (
                  <tr key={i} className="border-b border-border last:border-0"><td className="py-2 font-medium">{w.word}</td><td>{w.game}</td><td className="text-error">{w.avgScore}%</td></tr>
                ))}</tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
