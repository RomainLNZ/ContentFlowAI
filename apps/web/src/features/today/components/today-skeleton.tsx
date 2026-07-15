export function TodaySkeleton({ label = "Chargement de votre briefing" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="animate-pulse space-y-8">
      <div className="space-y-4 py-8">
        <div className="h-4 w-32 rounded-full bg-white/10" />
        <div className="h-12 max-w-2xl rounded-2xl bg-white/[0.08]" />
        <div className="h-5 max-w-xl rounded-full bg-white/[0.06]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-64 rounded-3xl border border-white/10 bg-white/[0.035]" />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
