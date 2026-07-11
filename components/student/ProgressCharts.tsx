"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XPBar, StreakBadge } from "./XPBar";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

type Props = {
  totalXP: number; level: number; nextLevelXP: number; prevLevelXP: number; streak: number;
  heatmap: { date: string; count: number }[];
  skills: { skill: string; value: number }[];
  xpHistory: { day: string; xp: number }[];
  words: string[];
  badges: { name: string; description: string; earned: boolean }[];
};

export function ProgressCharts({ totalXP, level, nextLevelXP, prevLevelXP, streak, heatmap, skills, xpHistory, words, badges }: Props) {
  const [showWords, setShowWords] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">My progress</h1>
        <StreakBadge days={streak} />
      </div>
      <Card><CardContent className="pt-5"><XPBar totalXP={totalXP} level={level} nextLevelXP={nextLevelXP} prevLevelXP={prevLevelXP} /></CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Streak calendar (30 days)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1.5">
            {heatmap.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} game${d.count === 1 ? "" : "s"}`}
                className={cn("h-6 rounded", d.count === 0 ? "bg-border" : d.count === 1 ? "bg-primary-light" : d.count <= 3 ? "bg-primary/60" : "bg-primary")}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skills}><PolarGrid /><PolarAngleAxis dataKey="skill" fontSize={12} /><Radar dataKey="value" stroke="#7F77DD" fill="#7F77DD" fillOpacity={0.4} /></RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>XP this week</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={xpHistory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line type="monotone" dataKey="xp" stroke="#1D9E75" strokeWidth={2} /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Words learned ({words.length})</CardTitle></CardHeader>
        <CardContent>
          {words.length === 0 ? <p className="text-sm text-txt-secondary">Play games to start learning words.</p> : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {(showWords ? words : words.slice(0, 15)).map((w) => <span key={w} className="text-xs bg-primary-light text-primary-dark rounded-pill px-2.5 py-1">{w}</span>)}
              </div>
              {words.length > 15 && <button className="text-xs text-primary mt-2" onClick={() => setShowWords(!showWords)}>{showWords ? "Show less" : `Show all ${words.length}`}</button>}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Badges</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div key={b.name} className={cn("border rounded-card p-3 text-center", b.earned ? "border-warning bg-orange-50" : "border-border opacity-40")}>
              <p className="text-2xl mb-1">{b.earned ? "🏅" : "🔒"}</p>
              <p className="text-sm font-medium">{b.name}</p>
              <p className="text-xs text-txt-secondary">{b.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
