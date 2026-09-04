export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome Header Skeleton */}
      <div className="h-28 rounded-2xl bg-primary/10 border border-primary/10" />

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-64 bg-bg-subtle rounded-xl border border-border/60" />
        <div className="h-64 bg-bg-subtle rounded-xl border border-border/60" />
      </div>
    </div>
  );
}
