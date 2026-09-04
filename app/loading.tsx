export default function RootLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 gap-3">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-txt-secondary font-medium animate-pulse">Chargement...</p>
    </div>
  );
}
