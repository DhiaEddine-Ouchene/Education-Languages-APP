export function XPBar({ totalXP, level, nextLevelXP, prevLevelXP }: { totalXP: number; level: number; nextLevelXP: number; prevLevelXP: number }) {
  const pct = Math.min(100, Math.round(((totalXP - prevLevelXP) / Math.max(nextLevelXP - prevLevelXP, 1)) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">Level {level}</span>
        <span className="text-txt-secondary">{totalXP} / {nextLevelXP} XP</span>
      </div>
      <div className="h-3 bg-primary-light rounded-pill overflow-hidden">
        <div className="h-full bg-accent rounded-pill transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StreakBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-orange-50 text-warning font-semibold px-3 py-1 text-sm">
      🔥 {days} day{days === 1 ? "" : "s"}
    </span>
  );
}
