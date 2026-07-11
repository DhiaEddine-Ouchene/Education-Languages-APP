export function GameProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-3 bg-primary-light rounded-pill overflow-hidden">
      <div className="h-full bg-primary rounded-pill transition-all duration-300" style={{ width: `${(current / Math.max(total, 1)) * 100}%` }} />
    </div>
  );
}

export function HeartBar({ lives, max = 3 }: { lives: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < lives ? "" : "opacity-20 grayscale"}>❤️</span>
      ))}
    </div>
  );
}
