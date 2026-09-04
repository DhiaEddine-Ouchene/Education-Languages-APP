export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 rounded-xl bg-bg-subtle border border-border/60" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
        <div className="h-24 bg-bg-subtle rounded-xl border border-border/60" />
      </div>
      <div className="h-96 bg-bg-subtle rounded-xl border border-border/60" />
    </div>
  );
}
