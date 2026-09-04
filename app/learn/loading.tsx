export default function LearnLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-28 rounded-2xl bg-primary/10 border border-primary/10" />

      {/* XP Bar Skeleton */}
      <div className="h-16 rounded-2xl bg-bg-subtle border border-border/60" />

      {/* Cards Grid Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-32 bg-bg-subtle rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
          <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
        </div>
      </div>

      {/* Games Grid Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-36 bg-bg-subtle rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="h-28 bg-bg-subtle rounded-xl border border-border/60" />
          <div className="h-28 bg-bg-subtle rounded-xl border border-border/60" />
          <div className="h-28 bg-bg-subtle rounded-xl border border-border/60" />
        </div>
      </div>
    </div>
  );
}
